import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;

  const text = fs.readFileSync(file, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const index = line.indexOf("=");
    if (index <= 0) continue;

    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(path.resolve(".env"));
loadEnvFile(path.resolve(".env.local"));

const ssl = String(process.env.DB_SSL || "false").toLowerCase() === "true";
const config = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || "electromoda",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "",
  application_name: "ElectroModa-db-check",
  connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 8000),
  ssl: ssl
    ? {
        rejectUnauthorized:
          process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
      }
    : false,
};

const expectedTables = [
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
];

console.log("ElectroModa - comprobación PostgreSQL");
console.log(`Servidor: ${config.host}:${config.port}`);
console.log(`Base: ${config.database}`);
console.log(`Usuario: ${config.user}`);

const client = new Client(config);

try {
  await client.connect();

  const info = await client.query(`
    SELECT current_database() AS database,
           current_user AS db_user,
           version() AS version
  `);

  const tables = await client.query(
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
      ORDER BY table_name
    `,
    [expectedTables],
  );

  const found = new Set(tables.rows.map((row) => row.table_name));
  const missing = expectedTables.filter((name) => !found.has(name));

  console.log("\n✓ Conexión correcta.");
  console.log(`✓ PostgreSQL respondió como ${info.rows[0].db_user}.`);
  console.log(`✓ Base activa: ${info.rows[0].database}.`);
  console.log(`✓ Tablas encontradas: ${found.size}/${expectedTables.length}.`);

  if (missing.length) {
    console.error(`✗ Faltan tablas: ${missing.join(", ")}`);
    process.exitCode = 2;
  } else {
    console.log("✓ Estructura de ElectroModa completa.");
  }
} catch (error) {
  console.error("\n✗ No se pudo validar PostgreSQL.");
  console.error(`Mensaje: ${error.message}`);
  if (error.code) console.error(`Código PostgreSQL/Node: ${error.code}`);

  console.error("\nRevisá .env.local y que PostgreSQL esté iniciado.");
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
