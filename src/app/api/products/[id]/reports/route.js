import { NextResponse } from "next/server";
import { getSession, isCustomer } from "../../../../../lib/auth";
import { dbQuery, withTransaction } from "../../../../../lib/postgres";
import { cleanText } from "../../../../../lib/marketplace";

const REASONS = new Set([
  "Información falsa",
  "Producto prohibido",
  "Imagen inapropiada",
  "Estafa o publicación engañosa",
  "Otro",
]);

export async function POST(request, { params }) {
  const user = await getSession();

  if (!isCustomer(user)) {
    return NextResponse.json(
      { error: "Solo los clientes pueden denunciar productos." },
      { status: 403 },
    );
  }

  const { id } = await params;
  const body = await request.json();
  const reason = cleanText(body.reason, 80);
  const details = cleanText(body.details, 2000);

  if (!REASONS.has(reason)) {
    return NextResponse.json({ error: "Motivo de denuncia inválido." }, { status: 400 });
  }

  try {
    await withTransaction(async (client) => {
      const exists = await client.query(
        `
          SELECT id
          FROM products
          WHERE id = $1
            AND active = TRUE
          LIMIT 1
        `,
        [id],
      );

      if (!exists.rows.length) {
        const error = new Error("Producto no encontrado.");
        error.status = 404;
        throw error;
      }

      await client.query(
        `
          INSERT INTO product_reports(product_id, reported_by, reason, details)
          VALUES($1, $2, $3, $4)
        `,
        [id, user.id, reason, details || null],
      );

      await client.query(
        `
          UPDATE products
          SET report_count = report_count + 1
          WHERE id = $1
        `,
        [id],
      );
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      error?.code === "23505" &&
      error?.constraint === "ux_product_reports_open_per_user"
    ) {
      return NextResponse.json(
        { error: "Ya tenés una denuncia abierta para este producto." },
        { status: 409 },
      );
    }

    if (error?.status === 404) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error?.message || "No se pudo enviar la denuncia." },
      { status: 500 },
    );
  }
}
