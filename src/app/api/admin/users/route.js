import { NextResponse } from "next/server";
import { getSession, isAdmin } from "../../../../lib/auth";
import { dbQuery } from "../../../../lib/postgres";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const actor = await getSession();

  if (!isAdmin(actor)) {
    return NextResponse.json({ error: "Solo administradores." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const search = String(searchParams.get("q") || "").trim().slice(0, 100);
  const role = String(searchParams.get("role") || "").trim();

  const result = await dbQuery(
    `
      SELECT
        u.id,
        u.role,
        u.username,
        u.email,
        u.dni,
        u.first_name,
        u.last_name,
        u.cuit,
        u.business_name,
        u.is_admin_owner,
        u.active,
        u.banned_at,
        u.banned_reason,
        u.deleted_at,
        u.created_at,
        COUNT(DISTINCT p.id)::int AS product_count,
        COUNT(DISTINCT st.id)::int AS support_ticket_count
      FROM users u
      LEFT JOIN products p ON p.seller_id = u.id
      LEFT JOIN support_tickets st ON st.opened_by = u.id
      WHERE ($1::text = '' OR
             LOWER(u.username) LIKE LOWER('%' || $1 || '%') OR
             LOWER(u.email) LIKE LOWER('%' || $1 || '%') OR
             LOWER(COALESCE(u.business_name, '')) LIKE LOWER('%' || $1 || '%') OR
             u.dni LIKE '%' || $1 || '%')
        AND ($2::text = '' OR u.role = $2)
      GROUP BY u.id
      ORDER BY
        u.is_admin_owner DESC,
        CASE u.role WHEN 'admin' THEN 0 WHEN 'company' THEN 1 ELSE 2 END,
        u.id DESC
      LIMIT 300
    `,
    [search, ["admin", "company", "customer"].includes(role) ? role : ""],
  );

  return NextResponse.json({
    actor: {
      id: actor.id,
      isAdminOwner: actor.is_admin_owner === true,
    },
    users: result.rows,
  });
}
