import { NextResponse } from "next/server";
import { getSession, isAdmin } from "../../../../lib/auth";
import { dbQuery } from "../../../../lib/postgres";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await getSession();

  if (!isAdmin(actor)) {
    return NextResponse.json({ error: "Solo administradores." }, { status: 403 });
  }

  const result = await dbQuery(`
    SELECT
      r.id,
      r.product_id,
      r.reason,
      r.details,
      r.status,
      r.created_at,
      r.handled_at,
      p.name AS product_name,
      p.image_url,
      p.moderation_status,
      reporter.username AS reporter_username,
      COALESCE(seller.business_name, seller.username, 'ElectroModa') AS seller_name,
      handler.username AS handler_username
    FROM product_reports r
    INNER JOIN products p ON p.id = r.product_id
    INNER JOIN users reporter ON reporter.id = r.reported_by
    LEFT JOIN users seller ON seller.id = p.seller_id
    LEFT JOIN users handler ON handler.id = r.handled_by
    ORDER BY
      CASE r.status
        WHEN 'open' THEN 0
        WHEN 'reviewing' THEN 1
        ELSE 2
      END,
      r.id DESC
    LIMIT 500
  `);

  return NextResponse.json({ reports: result.rows });
}
