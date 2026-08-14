import { cookies } from "next/headers";
import { dbQuery } from "./postgres";
import { hashToken } from "./passwords";

export const COOKIE = "electromoda_session";

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export async function getSession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;

  if (!token) return null;

  const result = await dbQuery(
    `
      SELECT
        u.id,
        u.role,
        u.username,
        u.email,
        u.dni,
        u.first_name,
        u.last_name,
        u.phone,
        u.address,
        u.cuit,
        u.business_name,
        u.tax_condition,
        u.is_admin_owner,
        u.banned_at,
        u.deleted_at
      FROM sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = $1
        AND s.expires_at > NOW()
        AND u.active = TRUE
        AND u.deleted_at IS NULL
        AND u.banned_at IS NULL
      LIMIT 1
    `,
    [hashToken(token)],
  );

  return result.rows[0] || null;
}

export function isAuthenticated(user) {
  return Boolean(user?.id);
}

export function isAdmin(user) {
  return Boolean(user?.role === "admin");
}

export function isAdminOwner(user) {
  return Boolean(user?.role === "admin" && user?.is_admin_owner === true);
}

export function isCompany(user) {
  return Boolean(user?.role === "company");
}

export function isCustomer(user) {
  return Boolean(user?.role === "customer");
}

export function isCoAdmin(user) {
  return Boolean(user?.role === "admin" && user?.is_admin_owner !== true);
}
