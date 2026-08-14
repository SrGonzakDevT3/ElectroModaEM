import { dbQuery } from "./postgres";

export const fallbackProducts = [
  { id: 1, name: "Campera Cyberpunk", category: "general", price_client: 35000, price_distributor: 29000, image_url: "/img/campera.jfif", active: true, is_offer: true, average_rating: 0, review_count: 0, has_options: false },
  { id: 2, name: "Remera Neon", category: "general", price_client: 20000, price_distributor: 16500, image_url: "/img/remera.jfif", active: true, is_offer: true, average_rating: 0, review_count: 0, has_options: false },
  { id: 3, name: "Zapatillas Tech", category: "general", price_client: 75000, price_distributor: 62000, image_url: "/img/zapas.jfif", active: true, is_offer: true, average_rating: 0, review_count: 0, has_options: false },
  { id: 4, name: "Sudadera con capucha", category: "hombre", price_client: 21678, price_distributor: 18000, image_url: "/colecciones/hombre/sudadera.jpeg", active: true, is_offer: false, average_rating: 0, review_count: 0, has_options: false },
  { id: 5, name: "Short suave", category: "hombre", price_client: 15985, price_distributor: 13000, image_url: "/colecciones/hombre/short-suave.jpg", active: true, is_offer: false, average_rating: 0, review_count: 0, has_options: false },
  { id: 6, name: "Combo 2x1 (musculosa + short)", category: "hombre", price_client: 10234, price_distributor: 8600, image_url: "/colecciones/hombre/musculosa-combo.jpg", active: true, is_offer: true, average_rating: 0, review_count: 0, has_options: false },
  { id: 7, name: "Combo rojo", category: "mujer", price_client: 24999, price_distributor: 20500, image_url: "/colecciones/mujer/combo-rojo.jpg", active: true, is_offer: false, average_rating: 0, review_count: 0, has_options: false },
  { id: 8, name: "Vestido blanco", category: "mujer", price_client: 45978, price_distributor: 38000, image_url: "/colecciones/mujer/vestido-blanco.jpg", active: true, is_offer: false, average_rating: 0, review_count: 0, has_options: false },
  { id: 9, name: "Top negro", category: "mujer", price_client: 12231, price_distributor: 9900, image_url: "/colecciones/mujer/top-negro.jpg", active: true, is_offer: false, average_rating: 0, review_count: 0, has_options: false },
  { id: 10, name: "Mochila deportiva (unisex)", category: "accesorios", price_client: 80895, price_distributor: 69000, image_url: "/colecciones/accesorios/mochila-deportiva.jpg", active: true, is_offer: false, average_rating: 0, review_count: 0, has_options: false },
  { id: 11, name: "Auriculares", category: "accesorios", price_client: 35293, price_distributor: 29000, image_url: "/colecciones/accesorios/auriculares.jpg", active: true, is_offer: false, average_rating: 0, review_count: 0, has_options: false },
  { id: 12, name: "Botella térmica", category: "accesorios", price_client: 25765, price_distributor: 21000, image_url: "/colecciones/accesorios/botella-termica.jpg", active: true, is_offer: false, average_rating: 0, review_count: 0, has_options: false },
  { id: 13, name: "Zapatillas Topper", category: "calzado", price_client: 67125, price_distributor: 55000, image_url: "/colecciones/calzados/Topper.jpg", active: true, is_offer: false, average_rating: 0, review_count: 0, has_options: false },
  { id: 14, name: "Adidas SportPremium", category: "calzado", price_client: 88256, price_distributor: 73000, image_url: "/colecciones/calzados/Adidas.jpg", active: true, is_offer: false, average_rating: 0, review_count: 0, has_options: false },
  { id: 15, name: "Nike edición limitada", category: "calzado", price_client: 135723, price_distributor: 112000, image_url: "/colecciones/calzados/Nike.jpg", active: true, is_offer: false, average_rating: 0, review_count: 0, has_options: false },
];

function normalize(row) {
  return {
    id: Number(row.id),
    name: row.name,
    category: row.category,
    subcategory: row.subcategory || null,
    description: row.description || "",
    seller_id: row.seller_id ? Number(row.seller_id) : null,
    seller_name: row.seller_name || null,
    price_client: Number(row.price_client),
    price_distributor: Number(row.price_distributor),
    image_url: row.image_url,
    active: row.active === true,
    is_offer: row.is_offer === true,
    average_rating: Number(row.average_rating || 0),
    review_count: Number(row.review_count || 0),
    has_options: row.has_options === true,
  };
}

export async function getProducts(category = null, mode = "all") {
  try {
    const result = await dbQuery(
      `
        SELECT
          p.id,
          p.name,
          p.category,
          p.subcategory,
          p.description,
          p.seller_id,
          COALESCE(s.business_name, s.username) AS seller_name,
          p.price_client,
          p.price_distributor,
          p.image_url,
          p.active,
          p.is_offer,
          COALESCE(r.average_rating, 0) AS average_rating,
          COALESCE(r.review_count, 0) AS review_count,
          EXISTS (
            SELECT 1
            FROM product_options po
            WHERE po.product_id = p.id
              AND po.active = TRUE
          ) AS has_options
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
        WHERE p.active = TRUE
          AND p.moderation_status = 'approved'
          AND ($1::text IS NULL OR p.category = $1)
          AND ($2::boolean = FALSE OR p.is_offer = TRUE)
        ORDER BY p.id
      `,
      [category, mode === "offers"],
    );

    if (result.rows.length) return result.rows.map(normalize);
  } catch {}

  let list = fallbackProducts.filter((product) => product.active);
  if (category) list = list.filter((product) => product.category === category);
  if (mode === "offers") list = list.filter((product) => product.is_offer);
  return list;
}
