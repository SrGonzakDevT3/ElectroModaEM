import { NextResponse } from "next/server";
import { dbQuery } from "../../../../lib/postgres";
import {
  hashToken,
  newSessionToken,
  verifyPassword,
} from "../../../../lib/passwords";
import {
  COOKIE,
  sessionCookieOptions,
} from "../../../../lib/auth";

const ALLOWED_ROLES = new Set(["customer", "company", "admin"]);

export async function POST(request) {
  try {
    const body = await request.json();
    const identifier = String(body.identifier ?? body.email ?? "")
      .trim()
      .toLowerCase();
    const password = String(body.password ?? "");
    const requestedRole = String(body.role ?? "").trim();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Ingresá usuario/email y contraseña." },
        { status: 400 },
      );
    }

    if (requestedRole && !ALLOWED_ROLES.has(requestedRole)) {
      return NextResponse.json(
        { error: "Tipo de perfil inválido." },
        { status: 400 },
      );
    }

    const result = await dbQuery(
      `
        SELECT
          id,
          username,
          email,
          password_hash,
          role,
          first_name,
          last_name,
          is_admin_owner
        FROM users
        WHERE active = TRUE
          AND (LOWER(email) = $1 OR LOWER(username) = $1)
        LIMIT 1
      `,
      [identifier],
    );

    const user = result.rows[0];

    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json(
        { error: "Credenciales incorrectas." },
        { status: 401 },
      );
    }

    if (requestedRole && user.role !== requestedRole) {
      return NextResponse.json(
        { error: "La cuenta no corresponde al tipo de perfil seleccionado." },
        { status: 403 },
      );
    }

    const token = newSessionToken();

    await dbQuery(
      `
        DELETE FROM sessions
        WHERE expires_at <= NOW() OR user_id = $1
      `,
      [user.id],
    );

    await dbQuery(
      `
        INSERT INTO sessions (user_id, token_hash, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '30 days')
      `,
      [user.id, hashToken(token)],
    );

    const response = NextResponse.json({
      ok: true,
      role: user.role,
      username: user.username,
      owner: user.is_admin_owner === true,
    });

    response.cookies.set(COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("[ElectroModa/login]", error);
    return NextResponse.json(
      { error: error?.message || "No se pudo iniciar sesión." },
      { status: 500 },
    );
  }
}
