import { NextResponse } from "next/server";
import { getSession, isAdmin } from "../../../../../lib/auth";
import { dbQuery } from "../../../../../lib/postgres";

export async function PATCH(request, { params }) {
  const actor = await getSession();

  if (!isAdmin(actor)) {
    return NextResponse.json({ error: "Solo administradores." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const action = String(body.action || "");

  if (action === "approve") {
    const result = await dbQuery(
      `
        UPDATE products
        SET active = TRUE,
            moderation_status = 'approved',
            moderated_by = $2,
            moderated_at = NOW()
        WHERE id = $1
        RETURNING id
      `,
      [id, actor.id],
    );

    if (!result.rows.length) {
      return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "review") {
    const result = await dbQuery(
      `
        UPDATE products
        SET active = FALSE,
            moderation_status = 'under_review',
            moderated_by = $2,
            moderated_at = NOW()
        WHERE id = $1
        RETURNING id
      `,
      [id, actor.id],
    );

    if (!result.rows.length) {
      return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  }

  if (action === "remove") {
    const result = await dbQuery(
      `
        UPDATE products
        SET active = FALSE,
            moderation_status = 'removed',
            moderated_by = $2,
            moderated_at = NOW()
        WHERE id = $1
        RETURNING id
      `,
      [id, actor.id],
    );

    if (!result.rows.length) {
      return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
}
