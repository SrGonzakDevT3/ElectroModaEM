import { NextResponse } from "next/server";
import { getSession, isAdmin } from "../../../../../../lib/auth";
import { dbQuery } from "../../../../../../lib/postgres";

function clean(value) {
  return String(value ?? "").trim();
}

async function getTicket(id) {
  const result = await dbQuery(
    `
      SELECT id, opened_by, assigned_admin_id, subject, status, priority,
             created_at, updated_at
      FROM support_tickets
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );
  return result.rows[0] || null;
}

function canReadTicket(user, ticket) {
  return isAdmin(user) || String(ticket.opened_by) === String(user.id);
}

export async function GET(_request, { params }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Iniciá sesión." }, { status: 401 });

    const { id } = await params;
    const ticket = await getTicket(String(id || ""));
    if (!ticket) return NextResponse.json({ error: "Consulta no encontrada." }, { status: 404 });
    if (!canReadTicket(user, ticket)) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

    const messages = await dbQuery(
      `
        SELECT m.id, m.body, m.created_at, u.username, u.role
        FROM support_messages m
        INNER JOIN users u ON u.id = m.author_id
        WHERE m.ticket_id = $1
        ORDER BY m.created_at
      `,
      [ticket.id],
    );

    return NextResponse.json({ ticket, messages: messages.rows });
  } catch (error) {
    console.error("[ElectroModa/support messages GET]", error);
    return NextResponse.json({ error: error?.message || "No se pudo cargar." }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Iniciá sesión." }, { status: 401 });

    const { id } = await params;
    const ticket = await getTicket(String(id || ""));
    if (!ticket) return NextResponse.json({ error: "Consulta no encontrada." }, { status: 404 });
    if (!canReadTicket(user, ticket)) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

    const payload = await request.json();
    const body = clean(payload.body);
    if (!body) return NextResponse.json({ error: "Escribí un mensaje." }, { status: 400 });

    await dbQuery(
      "INSERT INTO support_messages (ticket_id, author_id, body) VALUES ($1, $2, $3)",
      [ticket.id, user.id, body],
    );

    if (isAdmin(user)) {
      await dbQuery(
        `
          UPDATE support_tickets
          SET status = 'in_progress', assigned_admin_id = $1, updated_at = NOW()
          WHERE id = $2
        `,
        [user.id, ticket.id],
      );
    } else {
      await dbQuery(
        `
          UPDATE support_tickets
          SET status = CASE WHEN status = 'closed' THEN 'open' ELSE status END,
              updated_at = NOW()
          WHERE id = $1
        `,
        [ticket.id],
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ElectroModa/support messages POST]", error);
    return NextResponse.json({ error: error?.message || "No se pudo responder." }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await getSession();
    if (!isAdmin(user)) return NextResponse.json({ error: "Solo administradores." }, { status: 403 });

    const { id } = await params;
    const payload = await request.json();
    const status = ["open", "in_progress", "resolved", "closed"].includes(payload.status)
      ? payload.status
      : null;

    if (!status) return NextResponse.json({ error: "Estado inválido." }, { status: 400 });

    const result = await dbQuery(
      `
        UPDATE support_tickets
        SET status = $1, assigned_admin_id = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING id
      `,
      [status, user.id, String(id || "")],
    );

    if (!result.rows.length) return NextResponse.json({ error: "Consulta no encontrada." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ElectroModa/support messages PATCH]", error);
    return NextResponse.json({ error: error?.message || "No se pudo actualizar." }, { status: 500 });
  }
}
