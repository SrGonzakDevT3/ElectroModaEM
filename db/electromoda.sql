-- ============================================================
-- ELECTROMODA - ESQUEMA COMPLETO
-- PostgreSQL / pgAdmin 4
-- Incluye: roles, admins/co-admins, marketplace, carrito,
-- soporte, reseñas, denuncias, talles/colores y fotos.
--
-- ADVERTENCIA:
-- Este archivo recrea las tablas de ElectroModa.
-- Para una BD que YA funciona, usar:
-- db/migrations/002_roles_marketplace_reviews.sql
-- ============================================================

BEGIN;

DROP TABLE IF EXISTS product_reports CASCADE;
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS product_options CASCADE;
DROP TABLE IF EXISTS product_tags CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS support_messages CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS admin_designations CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  role VARCHAR(20) NOT NULL CHECK (role IN ('customer','company','admin')),
  username VARCHAR(80) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  dni VARCHAR(20) NOT NULL,
  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  cuit VARCHAR(20),
  business_name VARCHAR(200),
  tax_condition VARCHAR(80),
  is_admin_owner BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  banned_at TIMESTAMPTZ,
  banned_reason TEXT,
  banned_by BIGINT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customer_data_check CHECK (
    (role = 'customer'
      AND cuit IS NULL
      AND business_name IS NULL
      AND tax_condition IS NULL
      AND is_admin_owner = FALSE)
    OR role IN ('company','admin')
  ),
  CONSTRAINT company_data_check CHECK (
    (role = 'company' AND cuit IS NOT NULL AND business_name IS NOT NULL)
    OR role IN ('customer','admin')
  ),
  CONSTRAINT owner_admin_check CHECK (
    is_admin_owner = FALSE OR role = 'admin'
  )
);

ALTER TABLE users
  ADD CONSTRAINT users_banned_by_fkey
  FOREIGN KEY (banned_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX ux_users_username ON users(LOWER(username));
CREATE UNIQUE INDEX ux_users_email ON users(LOWER(email));
CREATE UNIQUE INDEX ux_users_dni ON users(dni);
CREATE UNIQUE INDEX ux_users_cuit ON users(cuit) WHERE cuit IS NOT NULL;
CREATE UNIQUE INDEX ux_one_admin_owner
  ON users(is_admin_owner) WHERE is_admin_owner = TRUE;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active_role ON users(active, role);

CREATE TABLE admin_designations (
  id BIGSERIAL PRIMARY KEY,
  admin_user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  designated_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  designated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expiry ON sessions(expires_at);

CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(30) NOT NULL
    CHECK (category IN ('general','hombre','mujer','calzado','accesorios','otros')),
  subcategory VARCHAR(60),
  description TEXT,
  price_client NUMERIC(12,2) NOT NULL CHECK (price_client >= 0),
  price_distributor NUMERIC(12,2) NOT NULL
    CHECK (price_distributor >= 0 AND price_distributor <= price_client),
  currency CHAR(3) NOT NULL DEFAULT 'ARS' CHECK (currency = 'ARS'),
  image_url TEXT,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  is_offer BOOLEAN NOT NULL DEFAULT FALSE,
  seller_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  moderation_status VARCHAR(20) NOT NULL DEFAULT 'approved'
    CHECK (moderation_status IN ('approved','under_review','removed')),
  moderated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  report_count INTEGER NOT NULL DEFAULT 0 CHECK (report_count >= 0),
  allow_sizes BOOLEAN NOT NULL DEFAULT FALSE,
  allow_colors BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_products_name ON products(LOWER(name));
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_offer ON products(is_offer) WHERE active = TRUE;
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_moderation ON products(moderation_status, active);

CREATE TABLE product_images (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_product_images_product ON product_images(product_id, position);

CREATE TABLE product_tags (
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag VARCHAR(80) NOT NULL,
  PRIMARY KEY(product_id, tag)
);
CREATE INDEX idx_product_tags_tag ON product_tags(tag);

CREATE TABLE product_options (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  option_type VARCHAR(20) NOT NULL CHECK (option_type IN ('size','color')),
  value VARCHAR(80) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, option_type, value)
);
CREATE INDEX idx_product_options_product
  ON product_options(product_id, option_type, position);

CREATE TABLE cart_items (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  selected_size VARCHAR(80),
  selected_color VARCHAR(80),
  variant_key TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX ux_cart_user_product_variant
  ON cart_items(user_id, product_id, variant_key);
CREATE INDEX idx_cart_user_updated ON cart_items(user_id, updated_at DESC);

CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','paid','processing','shipped','completed','cancelled')),
  currency CHAR(3) NOT NULL DEFAULT 'ARS' CHECK (currency = 'ARS'),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  shipping NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (shipping >= 0),
  total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  shipping_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orders_user ON orders(user_id);

CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'ARS' CHECK (currency = 'ARS')
);
CREATE INDEX idx_order_items_order ON order_items(order_id);

CREATE TABLE support_tickets (
  id BIGSERIAL PRIMARY KEY,
  opened_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_admin_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  subject VARCHAR(160) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','resolved','closed')),
  priority VARCHAR(20) NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_support_opened_by ON support_tickets(opened_by);
CREATE INDEX idx_support_admin_status
  ON support_tickets(assigned_admin_id, status);

CREATE TABLE support_messages (
  id BIGSERIAL PRIMARY KEY,
  ticket_id BIGINT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_support_messages_ticket
  ON support_messages(ticket_id, created_at);

CREATE TABLE product_reviews (
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
CREATE INDEX idx_product_reviews_product
  ON product_reviews(product_id, active, created_at DESC);

CREATE TABLE product_reports (
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
CREATE INDEX idx_product_reports_status
  ON product_reports(status, created_at DESC);
CREATE INDEX idx_product_reports_product ON product_reports(product_id);
CREATE UNIQUE INDEX ux_product_reports_open_per_user
  ON product_reports(product_id, reported_by)
  WHERE status IN ('open','reviewing');

CREATE OR REPLACE FUNCTION electromoda_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION electromoda_set_updated_at();

CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION electromoda_set_updated_at();

CREATE TRIGGER trg_cart_items_updated_at
BEFORE UPDATE ON cart_items
FOR EACH ROW EXECUTE FUNCTION electromoda_set_updated_at();

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION electromoda_set_updated_at();

CREATE TRIGGER trg_support_tickets_updated_at
BEFORE UPDATE ON support_tickets
FOR EACH ROW EXECUTE FUNCTION electromoda_set_updated_at();

CREATE TRIGGER trg_product_reviews_updated_at
BEFORE UPDATE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION electromoda_set_updated_at();

INSERT INTO products
  (name, category, subcategory, description, price_client, price_distributor,
   currency, image_url, stock, active, is_offer)
VALUES
('Campera Cyberpunk','general','Camperas','Campera deportiva de estilo tecnológico.',35000,29000,'ARS','/img/campera.jfif',25,TRUE,TRUE),
('Remera Neon','general','Remeras','Remera deportiva liviana.',20000,16500,'ARS','/img/remera.jfif',40,TRUE,TRUE),
('Zapatillas Tech','general','Zapatillas','Calzado deportivo de uso diario.',75000,62000,'ARS','/img/zapas.jfif',18,TRUE,TRUE),
('Sudadera con capucha','hombre','Buzos','Sudadera cómoda para entrenamiento y lifestyle.',21678,18000,'ARS','/colecciones/hombre/sudadera.jpeg',20,TRUE,FALSE),
('Short suave','hombre','Shorts','Short deportivo liviano.',15985,13000,'ARS','/colecciones/hombre/short-suave.jpg',30,TRUE,FALSE),
('Combo 2x1 (musculosa + short)','hombre','Otros','Combo promocional de entrenamiento.',10234,8600,'ARS','/colecciones/hombre/musculosa-combo.jpg',15,TRUE,TRUE),
('Combo rojo','mujer','Otros','Conjunto deportivo.',24999,20500,'ARS','/colecciones/mujer/combo-rojo.jpg',18,TRUE,FALSE),
('Vestido blanco','mujer','Vestidos','Vestido deportivo/lifestyle.',45978,38000,'ARS','/colecciones/mujer/vestido-blanco.jpg',12,TRUE,FALSE),
('Top negro','mujer','Tops','Top deportivo de soporte cómodo.',12231,9900,'ARS','/colecciones/mujer/top-negro.jpg',35,TRUE,FALSE),
('Mochila deportiva (unisex)','accesorios','Mochilas','Mochila para entrenamiento y uso diario.',80895,69000,'ARS','/colecciones/accesorios/mochila-deportiva.jpg',10,TRUE,FALSE),
('Auriculares','accesorios','Auriculares','Auriculares para entrenamiento.',35293,29000,'ARS','/colecciones/accesorios/auriculares.jpg',25,TRUE,FALSE),
('Botella térmica','accesorios','Botellas','Botella térmica reutilizable.',25765,21000,'ARS','/colecciones/accesorios/botella-termica.jpg',35,TRUE,FALSE),
('Zapatillas Topper','calzado','Zapatillas','Calzado deportivo.',67125,55000,'ARS','/colecciones/calzados/Topper.jpg',10,TRUE,FALSE),
('Adidas SportPremium','calzado','Zapatillas','Calzado deportivo premium.',88256,73000,'ARS','/colecciones/calzados/Adidas.jpg',8,TRUE,FALSE),
('Nike edición limitada','calzado','Zapatillas','Edición especial.',135723,112000,'ARS','/colecciones/calzados/Nike.jpg',5,TRUE,FALSE);

COMMIT;

-- Admin original:
-- 1) Registrarse normalmente.
-- 2) Ejecutar:
-- UPDATE users
-- SET role='admin', is_admin_owner=TRUE
-- WHERE email='tu-email@ejemplo.com';
-- 3) Ingresar desde /admin/login.
