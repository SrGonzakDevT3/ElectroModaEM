import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { dbQuery } from "../../../../lib/postgres";
import { hashToken } from "../../../../lib/passwords";
import { COOKIE } from "../../../../lib/auth";

export async function POST() {
  try {
    const store = await cookies();
    const token = store.get(COOKIE)?.value;
    if (token) {
      await dbQuery(
        "DELETE FROM sessions WHERE token_hash = $1",
        [hashToken(token)],
      );
    }
  } catch (error) {
    console.error("[ElectroModa/logout]", error);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
