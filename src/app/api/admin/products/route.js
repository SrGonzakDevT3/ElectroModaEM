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
      p.id,
      p.name,
      p.category,
      p.subcategory,
      p.description,
      p.price_client,
      p.price_distributor,
      p.image_url,
      p.stock,
      p.active,
      p.moderation_status,
      p.report_count,
      p.created_at,
      p.seller_id,
      COALESCE(s.business_name, s.username, 'ElectroModa') AS seller_name,
      COALESCE(s.email, '') AS seller_email,
      COALESCE(rv.review_count, 0)::int AS review_count,
      COALESCE(rv.average_rating, 0)::numeric AS average_rating
    FROM products p
    LEFT JOIN users s ON s.id = p.seller_id
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*)::int AS review_count,
        ROUND(AVG(r.rating)::numeric, 1) AS average_rating
      FROM product_reviews r
      WHERE r.product_id = p.id
        AND r.active = TRUE
    ) rv ON TRUE
    WHERE p.seller_id IS NOT NULL
    ORDER BY
      CASE p.moderation_status
        WHEN 'under_review' THEN 0
        WHEN 'approved' THEN 1
        ELSE 2
      END,
      p.report_count DESC,
      p.id DESC
    LIMIT 500
  `);

  return NextResponse.json({ products: result.rows });
}
