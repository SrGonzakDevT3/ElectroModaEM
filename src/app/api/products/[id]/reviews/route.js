import { NextResponse } from "next/server";
import { getSession, isCustomer } from "../../../../../lib/auth";
import { dbQuery } from "../../../../../lib/postgres";
import { cleanText, normalizeRating } from "../../../../../lib/marketplace";

export async function POST(request, { params }) {
  const user = await getSession();

  if (!isCustomer(user)) {
    return NextResponse.json(
      { error: "Solo los clientes pueden puntuar y comentar productos." },
      { status: 403 },
    );
  }

  const { id } = await params;
  const body = await request.json();
  const rating = normalizeRating(body.rating);
  const comment = cleanText(body.comment, 2000);

  if (!rating) {
    return NextResponse.json({ error: "Elegí entre 1 y 5 estrellas." }, { status: 400 });
  }

  const exists = await dbQuery(
    `
      SELECT id
      FROM products
      WHERE id = $1
        AND active = TRUE
        AND moderation_status = 'approved'
      LIMIT 1
    `,
    [id],
  );

  if (!exists.rows.length) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  await dbQuery(
    `
      INSERT INTO product_reviews(product_id, user_id, rating, comment, active)
      VALUES($1, $2, $3, $4, TRUE)
      ON CONFLICT(product_id, user_id)
      DO UPDATE SET
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        active = TRUE,
        updated_at = NOW()
    `,
    [id, user.id, rating, comment || null],
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request, { params }) {
  const user = await getSession();

  if (!isCustomer(user)) {
    return NextResponse.json({ error: "Solo clientes." }, { status: 403 });
  }

  const { id } = await params;

  await dbQuery(
    `
      UPDATE product_reviews
      SET active = FALSE,
          updated_at = NOW()
      WHERE product_id = $1
        AND user_id = $2
    `,
    [id, user.id],
  );

  return NextResponse.json({ ok: true });
}
