import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { dbQuery } from "../../../../lib/postgres";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { id } = await params;
  const user = await getSession();

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
        p.is_offer,
        p.allow_sizes,
        p.allow_colors,
        p.seller_id,
        COALESCE(s.business_name, s.username, 'ElectroModa') AS seller_name,
        COALESCE(r.average_rating, 0)::numeric AS average_rating,
        COALESCE(r.review_count, 0)::int AS review_count
      FROM products p
      LEFT JOIN users s ON s.id = p.seller_id
      LEFT JOIN LATERAL (
        SELECT
          ROUND(AVG(pr.rating)::numeric, 1) AS average_rating,
          COUNT(*)::int AS review_count
        FROM product_reviews pr
        WHERE pr.product_id = p.id
          AND pr.active = TRUE
      ) r ON TRUE
      WHERE p.id = $1
        AND p.active = TRUE
        AND p.moderation_status = 'approved'
      LIMIT 1
    `,
    [id],
  );

  const product = result.rows[0];

  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  const [images, options, tags, reviews, ownReview] = await Promise.all([
    dbQuery(
      `
        SELECT image_url, position
        FROM product_images
        WHERE product_id = $1
        ORDER BY position, id
      `,
      [id],
    ),
    dbQuery(
      `
        SELECT option_type, value, position
        FROM product_options
        WHERE product_id = $1
          AND active = TRUE
        ORDER BY option_type, position, id
      `,
      [id],
    ),
    dbQuery(
      `
        SELECT tag
        FROM product_tags
        WHERE product_id = $1
        ORDER BY tag
      `,
      [id],
    ),
    dbQuery(
      `
        SELECT
          pr.id,
          pr.rating,
          pr.comment,
          pr.created_at,
          u.username
        FROM product_reviews pr
        INNER JOIN users u ON u.id = pr.user_id
        WHERE pr.product_id = $1
          AND pr.active = TRUE
          AND u.active = TRUE
          AND u.deleted_at IS NULL
        ORDER BY pr.updated_at DESC
        LIMIT 100
      `,
      [id],
    ),
    user?.role === "customer"
      ? dbQuery(
          `
            SELECT id, rating, comment
            FROM product_reviews
            WHERE product_id = $1
              AND user_id = $2
            LIMIT 1
          `,
          [id, user.id],
        )
      : Promise.resolve({ rows: [] }),
  ]);

  const groupedOptions = {
    sizes: options.rows
      .filter((option) => option.option_type === "size")
      .map((option) => option.value),
    colors: options.rows
      .filter((option) => option.option_type === "color")
      .map((option) => option.value),
  };

  return NextResponse.json({
    product: {
      ...product,
      price_for_user:
        user?.role === "company"
          ? product.price_distributor
          : product.price_client,
    },
    images: images.rows.length
      ? images.rows.map((image) => image.image_url)
      : [product.image_url].filter(Boolean),
    options: groupedOptions,
    tags: tags.rows.map((row) => row.tag),
    reviews: reviews.rows,
    ownReview: ownReview.rows[0] || null,
    viewerRole: user?.role || null,
  });
}
