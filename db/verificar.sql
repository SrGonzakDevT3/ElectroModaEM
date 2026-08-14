SELECT
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = ANY(ARRAY[
    'users','sessions','products','cart_items','orders','order_items',
    'admin_designations','support_tickets','support_messages',
    'product_images','product_tags','product_options','product_reviews','product_reports'
  ])
ORDER BY table_name;

SELECT
  COUNT(*) AS tablas_electromoda
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = ANY(ARRAY[
    'users','sessions','products','cart_items','orders','order_items',
    'admin_designations','support_tickets','support_messages',
    'product_images','product_tags','product_options','product_reviews','product_reports'
  ]);

SELECT
  COUNT(*) AS productos,
  COUNT(*) FILTER (WHERE seller_id IS NOT NULL) AS productos_de_vendedores,
  COUNT(*) FILTER (WHERE moderation_status = 'under_review') AS en_revision
FROM products;

SELECT
  COUNT(*) AS reseñas
FROM product_reviews;

SELECT
  COUNT(*) FILTER (WHERE status IN ('open','reviewing')) AS denuncias_pendientes
FROM product_reports;
