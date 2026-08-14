import { NextResponse } from "next/server";
import { getSession, isAdminOwner } from "../../../../lib/auth";
import { dbQuery, withTransaction } from "../../../../lib/postgres";
import { hashPassword } from "../../../../lib/passwords";

function clean(value) {
  return String(value ?? "").trim();
}

export async function GET() {
  try {
    const user = await getSession();
    if (!isAdminOwner(user)) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

    const result = await dbQuery(`
      SELECT id, username, email, dni, first_name, last_name,
             active, is_admin_owner, created_at
      FROM users
      WHERE role = 'admin'
      ORDER BY is_admin_owner DESC, id
    `);

    return NextResponse.json({ admins: result.rows });
  } catch (error) {
    console.error("[ElectroModa/admins GET]", error);
    return NextResponse.json({ error: error?.message || "No se pudo cargar." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const actor = await getSession();
    if (!isAdminOwner(actor)) {
      return NextResponse.json(
        { error: "Solo el administrador original puede designar administradores." },
        { status: 403 },
      );
    }

    const body = await request.json();
    const username = clean(body.username).toLowerCase();
    const email = clean(body.email).toLowerCase();
    const dni = clean(body.dni).replace(/\D/g, "");
    const firstName = clean(body.firstName);
    const lastName = clean(body.lastName);
    const password = String(body.password || "");

    if (
      !/^[a-z0-9._-]{3,80}$/.test(username) ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
      !/^\d{7,9}$/.test(dni) ||
      !firstName || !lastName || password.length < 8
    ) {
      return NextResponse.json(
        { error: "Completá todos los datos del administrador y usá una contraseña de al menos 8 caracteres." },
        { status: 400 },
      );
    }

    const exists = await dbQuery(
      `SELECT id FROM users WHERE LOWER(email)=$1 OR LOWER(username)=$2 OR dni=$3 LIMIT 1`,
      [email, username, dni],
    );

    if (exists.rows.length) {
      return NextResponse.json({ error: "Ese email, usuario o DNI ya existe." }, { status: 409 });
    }

    await withTransaction(async (client) => {
      const inserted = await client.query(
        `
          INSERT INTO users (
            role, username, email, password_hash, dni,
            first_name, last_name, is_admin_owner
          )
          VALUES ('admin', $1, $2, $3, $4, $5, $6, FALSE)
          RETURNING id
        `,
        [username, email, hashPassword(password), dni, firstName, lastName],
      );

      await client.query(
        `INSERT INTO admin_designations (admin_user_id, designated_by) VALUES ($1, $2)`,
        [inserted.rows[0].id, actor.id],
      );
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ElectroModa/admins POST]", error);
    return NextResponse.json({ error: error?.message || "No se pudo crear el administrador." }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const actor = await getSession();
    if (!isAdminOwner(actor)) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

    const body = await request.json();
    const id = String(body.id || "");
    const active = Boolean(body.active);
    if (!id) return NextResponse.json({ error: "Falta id." }, { status: 400 });

    await dbQuery(
      `UPDATE users SET active=$1 WHERE id=$2 AND role='admin' AND is_admin_owner=FALSE`,
      [active, id],
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[ElectroModa/admins PATCH]", error);
    return NextResponse.json({ error: error?.message || "No se pudo actualizar." }, { status: 500 });
  }
}
