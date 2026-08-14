import { NextResponse } from "next/server";
import { dbHealth } from "../../../../lib/postgres";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await dbHealth());
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "No se pudo conectar con PostgreSQL.",
      },
      { status: 503 },
    );
  }
}
