import { NextResponse } from "next/server";
import { getSession } from "../../../lib/auth";
import { dbQuery } from "../../../lib/postgres";
import { buildVariantKey, cleanText } from "../../../lib/marketplace";

async function getProductWithOptions(productId) {
  const [productResult, optionResult] = await Promise.all([
    dbQuery(
      `
        SELECT
          id,
          stock,
          allow_sizes,
          allow_colors,
          active,
          moderation_status
        FROM products
        WHERE id = $1
        LIMIT 1
      `,
      [productId],
    ),
    dbQuery(
      `
        SELECT option_type, value
        FROM product_options
        WHERE product_id = $1
          AND active = TRUE
      `,
      [productId],
    ),
  ]);

  return {
    product: productResult.rows[0] || null,
    sizes: optionResult.rows
      .filter((row) => row.option_type === "size")
      .map((row) => row.value),
    colors: optionResult.rows
      .filter((row) => row.option_type === "color")
      .map((row) => row.value),
  };
}

function optionExists(list, value) {
  const normalized = cleanText(value, 80).toLocaleLowerCase("es-AR");
  return list.some(
    (item) => String(item).toLocaleLowerCase("es-AR") === normalized,
  );
}

export async function POST(request) {
  const user = await getSession();

  if (!user) {
    return NextResponse.json(
      { error: "Iniciá sesión para usar el carrito." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const productId = String(body.productId || "");
    const requested = Number(body.quantity ?? 1);
    const selectedSize = cleanText(body.selectedSize, 80);
    const selectedColor = cleanText(body.selectedColor, 80);

    if (!productId || !Number.isInteger(requested) || requested < 1 || requested > 99) {
      return NextResponse.json({ error: "Cantidad o producto inválido." }, { status: 400 });
    }

    const { product, sizes, colors } = await getProductWithOptions(productId);

    if (
      !product ||
      product.active !== true ||
      product.moderation_status !== "approved"
    ) {
      return NextResponse.json({ error: "Producto no disponible." }, { status: 404 });
    }

    if (product.allow_sizes === true) {
      if (!selectedSize || !optionExists(sizes, selectedSize)) {
        return NextResponse.json(
          { error: "Elegí un talle válido antes de agregar el producto." },
          { status: 400 },
        );
      }
    }

    if (product.allow_colors === true) {
      if (!selectedColor || !optionExists(colors, selectedColor)) {
        return NextResponse.json(
          { error: "Elegí un color válido antes de agregar el producto." },
          { status: 400 },
        );
      }
    }

    const variantKey = buildVariantKey(selectedSize, selectedColor);

    const currentResult = await dbQuery(
      `
        SELECT id, quantity
        FROM cart_items
        WHERE user_id = $1
          AND product_id = $2
          AND variant_key = $3
        LIMIT 1
      `,
      [user.id, productId, variantKey],
    );

    const current = currentResult.rows[0]
      ? Number(currentResult.rows[0].quantity)
      : 0;

    const nextQuantity = current + requested;
    const stock = Number(product.stock);

    if (nextQuantity > 99) {
      return NextResponse.json(
        { error: "La cantidad máxima por variante es 99." },
        { status: 400 },
      );
    }

    if (nextQuantity > stock) {
      return NextResponse.json(
        { error: `Stock insuficiente. Disponible: ${stock}.` },
        { status: 409 },
      );
    }

    await dbQuery(
      `
        INSERT INTO cart_items(
          user_id,
          product_id,
          quantity,
          selected_size,
          selected_color,
          variant_key
        )
        VALUES($1, $2, $3, $4, $5, $6)
        ON CONFLICT(user_id, product_id, variant_key)
        DO UPDATE SET
          quantity = EXCLUDED.quantity + cart_items.quantity,
          selected_size = EXCLUDED.selected_size,
          selected_color = EXCLUDED.selected_color,
          updated_at = NOW()
      `,
      [
        user.id,
        productId,
        requested,
        selectedSize || null,
        selectedColor || null,
        variantKey,
      ],
    );

    return NextResponse.json({ ok: true, quantity: nextQuantity });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "No se pudo agregar el producto." },
      { status: 500 },
    );
  }
}

export async function GET() {
  const user = await getSession();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  try {
    const result = await dbQuery(
      `
        SELECT
          c.id AS cart_item_id,
          c.product_id,
          c.quantity,
          c.selected_size,
          c.selected_color,
          c.variant_key,
          p.name,
          p.image_url,
          p.stock,
          CASE
            WHEN $1::text = 'company' THEN p.price_distributor
            ELSE p.price_client
          END AS price,
          p.currency
        FROM cart_items c
        INNER JOIN products p ON p.id = c.product_id
        WHERE c.user_id = $2
          AND p.active = TRUE
          AND p.moderation_status = 'approved'
        ORDER BY c.updated_at DESC
      `,
      [user.role, user.id],
    );

    return NextResponse.json({ items: result.rows });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "No se pudo cargar el carrito." },
      { status: 500 },
    );
  }
}

export async function PATCH(request) {
  const user = await getSession();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const cartItemId = String(body.cartItemId || "");
    const quantity = Number(body.quantity);

    if (
      !cartItemId ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 99
    ) {
      return NextResponse.json({ error: "Cantidad inválida." }, { status: 400 });
    }

    const row = await dbQuery(
      `
        SELECT c.id, p.stock
        FROM cart_items c
        INNER JOIN products p ON p.id = c.product_id
        WHERE c.id = $1
          AND c.user_id = $2
        LIMIT 1
      `,
      [cartItemId, user.id],
    );

    if (!row.rows.length) {
      return NextResponse.json({ error: "Ítem no encontrado." }, { status: 404 });
    }

    const stock = Number(row.rows[0].stock);

    if (quantity > stock) {
      return NextResponse.json(
        { error: `Stock insuficiente. Disponible: ${stock}.` },
        { status: 409 },
      );
    }

    await dbQuery(
      `
        UPDATE cart_items
        SET quantity = $1,
            updated_at = NOW()
        WHERE id = $2
          AND user_id = $3
      `,
      [quantity, cartItemId, user.id],
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "No se pudo actualizar." },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  const user = await getSession();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const cartItemId = String(body.cartItemId || "");

    if (!cartItemId) {
      return NextResponse.json({ error: "Falta el ítem del carrito." }, { status: 400 });
    }

    await dbQuery(
      `
        DELETE FROM cart_items
        WHERE id = $1
          AND user_id = $2
      `,
      [cartItemId, user.id],
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "No se pudo quitar el producto." },
      { status: 500 },
    );
  }
}
