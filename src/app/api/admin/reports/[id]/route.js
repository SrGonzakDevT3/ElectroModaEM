import { NextResponse } from "next/server";
import { getSession, isAdmin } from "../../../../../lib/auth";
import { withTransaction } from "../../../../../lib/postgres";

const STATUSES = new Set(["reviewing", "dismissed", "actioned"]);

export async function PATCH(request, { params }) {
  const actor = await getSession();

  if (!isAdmin(actor)) {
    return NextResponse.json({ error: "Solo administradores." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const status = String(body.status || "");
  const removeProduct = body.removeProduct === true;

  if (!STATUSES.has(status)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  const updated = await withTransaction(async (client) => {
    const reportResult = await client.query(
      `
        UPDATE product_reports
        SET status = $2,
            handled_by = $3,
            handled_at = NOW()
        WHERE id = $1
        RETURNING product_id
      `,
      [id, status, actor.id],
    );

    if (!reportResult.rows.length) return null;

    const productId = reportResult.rows[0].product_id;

    if (removeProduct) {
      await client.query(
        `
          UPDATE products
          SET active = FALSE,
              moderation_status = 'removed',
              moderated_by = $2,
              moderated_at = NOW()
          WHERE id = $1
        `,
        [productId, actor.id],
      );
    } else if (status === "reviewing") {
      await client.query(
        `
          UPDATE products
          SET active = FALSE,
              moderation_status = 'under_review',
              moderated_by = $2,
              moderated_at = NOW()
          WHERE id = $1
            AND moderation_status <> 'removed'
        `,
        [productId, actor.id],
      );
    }

    return productId;
  });

  if (!updated) {
    return NextResponse.json({ error: "Denuncia no encontrada." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
