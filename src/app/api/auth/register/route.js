import { NextResponse } from "next/server";
import { dbQuery, withTransaction } from "../../../../lib/postgres";
import {
  hashPassword,
  hashToken,
  newSessionToken,
} from "../../../../lib/passwords";
import {
  COOKIE,
  sessionCookieOptions,
} from "../../../../lib/auth";

function clean(value) {
  return String(value ?? "").trim();
}

function onlyDigits(value) {
  return clean(value).replace(/\D/g, "");
}

function validDni(value) {
  return /^\d{7,9}$/.test(value);
}

function validCuit(value) {
  return /^\d{11}$/.test(value);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request) {
  try {
    const body = await request.json();

    const role = body.role === "company" ? "company" : "customer";
    const username = clean(body.username).toLowerCase();
    const email = clean(body.email).toLowerCase();
    const password = String(body.password || "");
    const dni = onlyDigits(body.dni);
    const firstName = clean(body.firstName);
    const lastName = clean(body.lastName);
    const businessName = clean(body.businessName);
    const cuit = onlyDigits(body.cuit);
    const taxCondition = clean(body.taxCondition);

    if (!/^[a-z0-9._-]{3,80}$/.test(username)) {
      return NextResponse.json(
        { error: "El nombre de usuario debe tener entre 3 y 80 caracteres." },
        { status: 400 },
      );
    }

    if (!validEmail(email)) {
      return NextResponse.json(
        { error: "Ingresá un email válido." },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 },
      );
    }

    if (!validDni(dni)) {
      return NextResponse.json(
        { error: "El DNI debe contener entre 7 y 9 números." },
        { status: 400 },
      );
    }

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "Completá nombre y apellido." },
        { status: 400 },
      );
    }

    if (role === "company" && (!businessName || !validCuit(cuit))) {
      return NextResponse.json(
        {
          error:
            "La cuenta de empresa/distribuidora requiere nombre de empresa/PyME y CUIT válido.",
        },
        { status: 400 },
      );
    }

    const duplicates = await dbQuery(
      `
        SELECT id
        FROM users
        WHERE LOWER(email) = $1
           OR LOWER(username) = $2
           OR dni = $3
           OR ($4::text IS NOT NULL AND cuit = $4)
        LIMIT 1
      `,
      [email, username, dni, role === "company" ? cuit : null],
    );

    if (duplicates.rows.length) {
      return NextResponse.json(
        { error: "El email, usuario, DNI o CUIT ya está registrado." },
        { status: 409 },
      );
    }

    const token = newSessionToken();

    const user = await withTransaction(async (client) => {
      const inserted = await client.query(
        `
          INSERT INTO users (
            role,
            username,
            email,
            password_hash,
            dni,
            first_name,
            last_name,
            cuit,
            business_name,
            tax_condition
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          RETURNING id, role, username, email, first_name, last_name
        `,
        [
          role,
          username,
          email,
          hashPassword(password),
          dni,
          firstName,
          lastName,
          role === "company" ? cuit : null,
          role === "company" ? businessName : null,
          role === "company" ? taxCondition || null : null,
        ],
      );

      const createdUser = inserted.rows[0];

      await client.query(
        `
          INSERT INTO sessions (user_id, token_hash, expires_at)
          VALUES ($1, $2, NOW() + INTERVAL '30 days')
        `,
        [createdUser.id, hashToken(token)],
      );

      return createdUser;
    });

    const response = NextResponse.json({ ok: true, user });
    response.cookies.set(COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("[ElectroModa/registro]", error);
    return NextResponse.json(
      { error: error?.message || "No se pudo crear la cuenta." },
      { status: 500 },
    );
  }
}
