BEGIN;

-- ElectroModa - Migración 002
-- Roles/Moderación + Marketplace + Reseñas + Denuncias + Variantes
-- Conserva los datos existentes.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS banned_reason TEXT,
  ADD COLUMN IF NOT EXISTS banned_by BIGINT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_banned_by_fkey') THEN
    ALTER TABLE users
      ADD CONSTRAINT users_banned_by_fkey
      FOREIGN KEY (banned_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_active_role ON users(active, role);
CREATE INDEX IF NOT EXISTS idx_users_banned ON users(banned_at) WHERE banned_at IS NOT NULL;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS seller_id BIGINT,
  ADD COLUMN IF NOT EXISTS subcategory VARCHAR(60),
  ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS moderated_by BIGINT,
  ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS report_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS allow_sizes BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS allow_colors BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_seller_id_fkey') THEN
    ALTER TABLE products
      ADD CONSTRAINT products_seller_id_fkey
      FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_moderated_by_fkey') THEN
    ALTER TABLE products
      ADD CONSTRAINT products_moderated_by_fkey
      FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_name_key;
CREATE INDEX IF NOT EXISTS idx_products_name ON products(LOWER(name));

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE products
  ADD CONSTRAINT products_category_check
  CHECK (category IN ('general','hombre','mujer','calzado','accesorios','otros'));

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_moderation_status_check;
ALTER TABLE products
  ADD CONSTRAINT products_moderation_status_check
  CHECK (moderation_status IN ('approved','under_review','removed'));

CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_moderation ON products(moderation_status, active);

CREATE TABLE IF NOT EXISTS product_images (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id, position);

CREATE TABLE IF NOT EXISTS product_tags (
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag VARCHAR(80) NOT NULL,
  PRIMARY KEY (product_id, tag)
);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON product_tags(tag);

CREATE TABLE IF NOT EXISTS product_options (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  option_type VARCHAR(20) NOT NULL CHECK (option_type IN ('size','color')),
  value VARCHAR(80) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, option_type, value)
);
CREATE INDEX IF NOT EXISTS idx_product_options_product ON product_options(product_id, option_type, position);

CREATE TABLE IF NOT EXISTS product_reviews (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id, active, created_at DESC);

CREATE TABLE IF NOT EXISTS product_reports (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  reported_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(80) NOT NULL,
  details TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','reviewing','dismissed','actioned')),
  handled_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  handled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_product_reports_status ON product_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_reports_product ON product_reports(product_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_product_reports_open_per_user
  ON product_reports(product_id, reported_by)
  WHERE status IN ('open','reviewing');

ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS id BIGSERIAL,
  ADD COLUMN IF NOT EXISTS selected_size VARCHAR(80),
  ADD COLUMN IF NOT EXISTS selected_color VARCHAR(80),
  ADD COLUMN IF NOT EXISTS variant_key TEXT NOT NULL DEFAULT '';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_pkey') THEN
    ALTER TABLE cart_items DROP CONSTRAINT cart_items_pkey;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_id_pkey') THEN
    ALTER TABLE cart_items ADD CONSTRAINT cart_items_id_pkey PRIMARY KEY (id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS ux_cart_user_product_variant
  ON cart_items(user_id, product_id, variant_key);
CREATE INDEX IF NOT EXISTS idx_cart_user_updated ON cart_items(user_id, updated_at DESC);

DROP TRIGGER IF EXISTS trg_product_reviews_updated_at ON product_reviews;
CREATE TRIGGER trg_product_reviews_updated_at
BEFORE UPDATE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION electromoda_set_updated_at();

DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO missing_count
  FROM (
    VALUES
      ('users'),('sessions'),('products'),('cart_items'),('orders'),('order_items'),
      ('admin_designations'),('support_tickets'),('support_messages'),
      ('product_images'),('product_tags'),('product_options'),('product_reviews'),('product_reports')
  ) AS expected(name)
  WHERE to_regclass('public.' || expected.name) IS NULL;

  IF missing_count <> 0 THEN
    RAISE EXCEPTION 'Migración incompleta: faltan % tablas esperadas.', missing_count;
  END IF;
END $$;

COMMIT;

SELECT
  'OK' AS estado,
  COUNT(*) AS tablas_electromoda
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = ANY(ARRAY[
    'users','sessions','products','cart_items','orders','order_items',
    'admin_designations','support_tickets','support_messages',
    'product_images','product_tags','product_options','product_reviews','product_reports'
  ]);
