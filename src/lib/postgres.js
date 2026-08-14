import pg from "pg";

const { Pool } = pg;

function envBoolean(name, fallback = false) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return String(raw).toLowerCase() === "true";
}

export function getDbConfigForHealth() {
  return {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || "electromoda",
    user: process.env.DB_USER || "postgres",
    ssl: envBoolean("DB_SSL", false),
  };
}

function createPool() {
  const config = getDbConfigForHealth();

  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error("DB_PORT inválido.");
  }

  return new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: process.env.DB_PASSWORD || "",
    application_name: "ElectroModa",
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: Math.max(
      1_000,
      Number(process.env.DB_CONNECTION_TIMEOUT_MS || 8_000),
    ),
    ssl: config.ssl
      ? {
          rejectUnauthorized:
            process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
        }
      : false,
  });
}

const globalForPg = globalThis;

export const pool =
  globalForPg.__electromodaPgPool ||
  createPool();

if (process.env.NODE_ENV !== "production") {
  globalForPg.__electromodaPgPool = pool;
}

pool.on("error", (error) => {
  console.error("[ElectroModa/PostgreSQL] Error inesperado en el pool:", error);
});

function wrapDbError(error) {
  if (error?.message?.startsWith?.("BD: ")) return error;

  const parts = [error?.message || "Error de PostgreSQL."];

  if (error?.code) parts.push(`código ${error.code}`);
  if (error?.detail) parts.push(error.detail);
  if (error?.hint) parts.push(`Sugerencia: ${error.hint}`);

  const wrapped = new Error(`BD: ${parts.join(" · ")}`);
  wrapped.code = error?.code;
  wrapped.constraint = error?.constraint;
  wrapped.detail = error?.detail;
  wrapped.hint = error?.hint;
  wrapped.status = error?.status;
  wrapped.cause = error;
  return wrapped;
}

export async function dbQuery(text, values = []) {
  try {
    return await pool.query(text, values);
  } catch (error) {
    throw wrapDbError(error);
  }
}

export async function withTransaction(callback) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw wrapDbError(error);
  } finally {
    client.release();
  }
}

// Compatibilidad temporal con algunas consultas internas existentes.
// Las rutas nuevas de autenticación usan parámetros $1, $2, ... directamente.
export function sqlString(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return `'${String(value).replaceAll("'", "''")}'`;
}

export async function dbHealth() {
  const started = Date.now();
  const result = await dbQuery(`
    SELECT
      current_database() AS database,
      current_user AS db_user,
      version() AS version,
      NOW() AS server_time
  `);

  const tables = await dbQuery(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = ANY($1::text[])
    ORDER BY table_name
  `, [[
    "users",
    "admin_designations",
    "sessions",
    "products",
    "cart_items",
    "orders",
    "order_items",
    "support_tickets",
    "support_messages",
    "product_images",
    "product_tags",
    "product_options",
    "product_reviews",
    "product_reports",
  ]]);

  const expected = 14;

  return {
    ok: tables.rows.length === expected,
    latencyMs: Date.now() - started,
    config: getDbConfigForHealth(),
    server: result.rows[0],
    tables: tables.rows.map((row) => row.table_name),
    expectedTables: expected,
    missingTables: [
      "users",
      "admin_designations",
      "sessions",
      "products",
      "cart_items",
      "orders",
      "order_items",
      "support_tickets",
      "support_messages",
      "product_images",
      "product_tags",
      "product_options",
      "product_reviews",
      "product_reports",
    ].filter((name) => !tables.rows.some((row) => row.table_name === name)),
  };
}
