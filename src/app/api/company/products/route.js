import { NextResponse } from "next/server";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getSession, isCompany } from "../../../../lib/auth";
import { dbQuery, withTransaction } from "../../../../lib/postgres";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_SUBCATEGORIES,
  cleanText,
  extractHashtags,
  parseCommaList,
} from "../../../../lib/marketplace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_MIME = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

function numberValue(value) {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function intValue(value) {
  const n = Number(value);
  return Number.isInteger(n) ? n : NaN;
}

async function requireCompany() {
  const user = await getSession();
  return isCompany(user) ? user : null;
}

export async function GET() {
  const user = await requireCompany();

  if (!user) {
    return NextResponse.json(
      { error: "Solo las cuentas de empresa/distribuidora pueden usar esta sección." },
      { status: 403 },
    );
  }

  const result = await dbQuery(
    `
      SELECT
        p.id,
        p.name,
        p.category,
        p.subcategory,
        p.description,
        p.price_client,
        p.price_distributor,
        p.currency,
        p.image_url,
        p.stock,
        p.active,
        p.is_offer,
        p.moderation_status,
        p.report_count,
        p.allow_sizes,
        p.allow_colors,
        p.created_at,
        COALESCE(r.review_count, 0)::int AS review_count,
        COALESCE(r.average_rating, 0)::numeric AS average_rating
      FROM products p
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*)::int AS review_count,
          ROUND(AVG(pr.rating)::numeric, 1) AS average_rating
        FROM product_reviews pr
        WHERE pr.product_id = p.id
          AND pr.active = TRUE
      ) r ON TRUE
      WHERE p.seller_id = $1
      ORDER BY p.id DESC
    `,
    [user.id],
  );

  return NextResponse.json({ products: result.rows });
}

export async function POST(request) {
  const user = await requireCompany();

  if (!user) {
    return NextResponse.json(
      { error: "Solo las cuentas de empresa/distribuidora pueden publicar productos." },
      { status: 403 },
    );
  }

  const form = await request.formData();

  const name = cleanText(form.get("name"), 200);
  const category = cleanText(form.get("category"), 30);
  let subcategory = cleanText(form.get("subcategory"), 60);
  const description = cleanText(form.get("description"), 4000);
  const priceClient = numberValue(form.get("priceClient"));
  const rawDistributor = form.get("priceDistributor");
  const priceDistributor = rawDistributor
    ? numberValue(rawDistributor)
    : priceClient;
  const stock = intValue(form.get("stock"));
  const isOffer = String(form.get("isOffer") || "") === "true";

  const sizes = parseCommaList(form.get("sizes"), 30);
  const colors = parseCommaList(form.get("colors"), 30);
  const hashtags = extractHashtags(description, 30);

  const hashtagSubcategories = new Map([
    ["zapatillas", "Zapatillas"],
    ["remeras", "Remeras"],
    ["remera", "Remeras"],
    ["pantalones", "Pantalones"],
    ["shorts", "Shorts"],
    ["buzos", "Buzos"],
    ["camperas", "Camperas"],
    ["vestidos", "Vestidos"],
    ["tops", "Tops"],
    ["mochilas", "Mochilas"],
    ["auriculares", "Auriculares"],
    ["botellas", "Botellas"],
  ]);

  if (!subcategory || subcategory === "Otros") {
    const inferred = hashtags
      .map((tag) => hashtagSubcategories.get(tag))
      .find(Boolean);

    if (inferred) subcategory = inferred;
  }

  const allowedCategories = new Set(PRODUCT_CATEGORIES.map((item) => item.value));

  if (name.length < 2) {
    return NextResponse.json({ error: "Ingresá un nombre de producto." }, { status: 400 });
  }

  if (!allowedCategories.has(category)) {
    return NextResponse.json({ error: "Categoría inválida." }, { status: 400 });
  }

  if (!PRODUCT_SUBCATEGORIES.includes(subcategory)) {
    return NextResponse.json({ error: "Subcategoría inválida." }, { status: 400 });
  }

  if (description.length < 5) {
    return NextResponse.json(
      { error: "La descripción debe tener al menos 5 caracteres." },
      { status: 400 },
    );
  }

  if (!Number.isFinite(priceClient) || priceClient < 0) {
    return NextResponse.json({ error: "Precio de venta inválido." }, { status: 400 });
  }

  if (
    !Number.isFinite(priceDistributor) ||
    priceDistributor < 0 ||
    priceDistributor > priceClient
  ) {
    return NextResponse.json(
      { error: "El precio para distribuidoras no puede superar al precio normal." },
      { status: 400 },
    );
  }

  if (!Number.isInteger(stock) || stock < 0 || stock > 1000000) {
    return NextResponse.json({ error: "Stock inválido." }, { status: 400 });
  }

  const files = form
    .getAll("images")
    .filter((value) => value && typeof value.arrayBuffer === "function");

  if (files.length < 1) {
    return NextResponse.json(
      { error: "Subí al menos una foto del producto." },
      { status: 400 },
    );
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Podés subir como máximo ${MAX_FILES} imágenes.` },
      { status: 400 },
    );
  }

  for (const file of files) {
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: "Solo se permiten imágenes JPG, PNG o WEBP." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Cada imagen puede pesar como máximo 5 MB." },
        { status: 400 },
      );
    }
  }

  const relativeDir = path.posix.join("uploads", "products", String(user.id));
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);
  await mkdir(absoluteDir, { recursive: true });

  const savedFiles = [];

  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const extension = ALLOWED_MIME.get(file.type);
      const filename = `${Date.now()}-${randomUUID()}.${extension}`;
      const absolutePath = path.join(absoluteDir, filename);
      const publicUrl = `/${relativeDir}/${filename}`;

      const bytes = Buffer.from(await file.arrayBuffer());
      await writeFile(absolutePath, bytes);

      savedFiles.push({
        absolutePath,
        publicUrl,
        position: index,
      });
    }

    const productId = await withTransaction(async (client) => {
      const inserted = await client.query(
        `
          INSERT INTO products (
            name,
            category,
            subcategory,
            description,
            price_client,
            price_distributor,
            currency,
            image_url,
            stock,
            active,
            is_offer,
            seller_id,
            moderation_status,
            allow_sizes,
            allow_colors
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, 'ARS',
            $7, $8, TRUE, $9, $10, 'approved', $11, $12
          )
          RETURNING id
        `,
        [
          name,
          category,
          subcategory,
          description,
          priceClient,
          priceDistributor,
          savedFiles[0].publicUrl,
          stock,
          isOffer,
          user.id,
          sizes.length > 0,
          colors.length > 0,
        ],
      );

      const id = inserted.rows[0].id;

      for (const image of savedFiles) {
        await client.query(
          `
            INSERT INTO product_images(product_id, image_url, position)
            VALUES($1, $2, $3)
          `,
          [id, image.publicUrl, image.position],
        );
      }

      for (let index = 0; index < hashtags.length; index += 1) {
        await client.query(
          `
            INSERT INTO product_tags(product_id, tag)
            VALUES($1, $2)
            ON CONFLICT DO NOTHING
          `,
          [id, hashtags[index]],
        );
      }

      for (let index = 0; index < sizes.length; index += 1) {
        await client.query(
          `
            INSERT INTO product_options(product_id, option_type, value, position)
            VALUES($1, 'size', $2, $3)
          `,
          [id, sizes[index], index],
        );
      }

      for (let index = 0; index < colors.length; index += 1) {
        await client.query(
          `
            INSERT INTO product_options(product_id, option_type, value, position)
            VALUES($1, 'color', $2, $3)
          `,
          [id, colors[index], index],
        );
      }

      return id;
    });

    return NextResponse.json({ ok: true, id: productId });
  } catch (error) {
    await Promise.allSettled(
      savedFiles.map((file) => unlink(file.absolutePath)),
    );

    return NextResponse.json(
      { error: error?.message || "No se pudo publicar el producto." },
      { status: 500 },
    );
  }
}
