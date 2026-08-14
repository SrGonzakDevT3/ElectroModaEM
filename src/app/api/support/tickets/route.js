import { NextResponse } from "next/server";
import { getSession, isAdmin } from "../../../../lib/auth";
import { dbQuery, withTransaction } from "../../../../lib/postgres";

function clean(value) {
  return String(value ?? "").trim();
}

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Iniciá sesión." }, { status: 401 });
    }

    const admin = isAdmin(user);
    const values = admin ? [] : [user.id];
    const where = admin ? "" : "WHERE t.opened_by = $1";

    const result = await dbQuery(
      `
        SELECT
          t.id,
          t.subject,
          t.status,
          t.priority,
          t.created_at,
          t.updated_at,
          u.username AS opened_by_username,
          a.username AS assigned_admin_username,
          (
            SELECT COUNT(*)
            FROM support_messages m
            WHERE m.ticket_id = t.id
          ) AS message_count
        FROM support_tickets t
        INNER JOIN users u ON u.id = t.opened_by
        LEFT JOIN users a ON a.id = t.assigned_admin_id
        ${where}
        ORDER BY t.updated_at DESC
      `,
      values,
    );

    return NextResponse.json({ tickets: result.rows });
  } catch (error) {
    console.error("[ElectroModa/support GET]", error);
    return NextResponse.json(
      { error: error?.message || "No se pudo cargar soporte." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { error: "Iniciá sesión para contactar al soporte." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const subject = clean(body.subject);
    const message = clean(body.body);
    const priority = ["low", "normal", "high", "urgent"].includes(body.priority)
      ? body.priority
      : "normal";

    if (subject.length < 3 || message.length < 3) {
      return NextResponse.json(
        { error: "Completá asunto y mensaje." },
        { status: 400 },
      );
    }

    const ticketId = await withTransaction(async (client) => {
      const ticket = await client.query(
        `
          INSERT INTO support_tickets (opened_by, subject, priority)
          VALUES ($1, $2, $3)
          RETURNING id
        `,
        [user.id, subject, priority],
      );

      const id = ticket.rows[0].id;

      await client.query(
        `
          INSERT INTO support_messages (ticket_id, author_id, body)
          VALUES ($1, $2, $3)
        `,
        [id, user.id, message],
      );

      return id;
    });

    return NextResponse.json({ ok: true, id: ticketId });
  } catch (error) {
    console.error("[ElectroModa/support POST]", error);
    return NextResponse.json(
      { error: error?.message || "No se pudo enviar el mensaje." },
      { status: 500 },
    );
  }
}
