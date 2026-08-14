import { NextResponse } from "next/server";
import { getSession, isCompany } from "../../../../../lib/auth";
import { dbQuery } from "../../../../../lib/postgres";

export async function DELETE(_request, { params }) {
  const user = await getSession();

  if (!isCompany(user)) {
    return NextResponse.json({ error: "Solo empresas." }, { status: 403 });
  }

  const { id } = await params;

  const result = await dbQuery(
    `
      UPDATE products
      SET active = FALSE,
          moderation_status = 'removed',
          moderated_at = NOW()
      WHERE id = $1
        AND seller_id = $2
      RETURNING id
    `,
    [id, user.id],
  );

  if (!result.rows.length) {
    return NextResponse.json(
      { error: "Producto inexistente o no pertenece a tu cuenta." },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
