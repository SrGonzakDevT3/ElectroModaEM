import { NextResponse } from "next/server";
import { getSession, isAdmin, isAdminOwner } from "../../../../../lib/auth";
import { dbQuery, withTransaction } from "../../../../../lib/postgres";

async function getTarget(id) {
  const result = await dbQuery(
    `
      SELECT
        id, role, username, email, active, banned_at,
        deleted_at, is_admin_owner
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );
  return result.rows[0] || null;
}

function blockedByHierarchy(actor, target) {
  if (!target) return "Usuario inexistente.";
  if (target.is_admin_owner === true) return "El administrador original está protegido.";
  if (target.role === "admin" && !isAdminOwner(actor)) {
    return "Un co-admin no puede modificar a otro administrador.";
  }
  return null;
}

export async function PATCH(request, { params }) {
  const actor = await getSession();

  if (!isAdmin(actor)) {
    return NextResponse.json({ error: "Solo administradores." }, { status: 403 });
  }

  const { id } = await params;
  const targetId = String(id || "");
  const body = await request.json();
  const action = String(body.action || "");

  const target = await getTarget(targetId);
  const hierarchyError = blockedByHierarchy(actor, target);

  if (hierarchyError && action !== "promote") {
    return NextResponse.json({ error: hierarchyError }, { status: 403 });
  }

  if (!target) {
    return NextResponse.json({ error: "Usuario inexistente." }, { status: 404 });
  }

  if (String(actor.id) === String(target.id) && ["ban", "delete"].includes(action)) {
    return NextResponse.json(
      { error: "No podés banear o eliminar tu propia cuenta administrativa." },
      { status: 400 },
    );
  }

  if (action === "ban") {
    const reason = String(body.reason || "Incumplimiento de normas").trim().slice(0, 500);

    await withTransaction(async (client) => {
      await client.query(
        `
          UPDATE users
          SET active = FALSE,
              banned_at = NOW(),
              banned_reason = $2,
              banned_by = $3
          WHERE id = $1
        `,
        [target.id, reason, actor.id],
      );

      await client.query("DELETE FROM sessions WHERE user_id = $1", [target.id]);

      if (target.role === "company") {
        await client.query(
          `
            UPDATE products
            SET active = FALSE,
                moderation_status = 'under_review',
                moderated_by = $2,
                moderated_at = NOW()
            WHERE seller_id = $1
              AND moderation_status <> 'removed'
          `,
          [target.id, actor.id],
        );
      }
    });

    return NextResponse.json({ ok: true, action: "ban" });
  }

  if (action === "unban") {
    await dbQuery(
      `
        UPDATE users
        SET active = TRUE,
            banned_at = NULL,
            banned_reason = NULL,
            banned_by = NULL
        WHERE id = $1
          AND deleted_at IS NULL
      `,
      [target.id],
    );

    return NextResponse.json({
      ok: true,
      action: "unban",
      note: target.role === "company"
        ? "La cuenta fue reactivada. Sus productos siguen sujetos a moderación."
        : undefined,
    });
  }

  if (action === "promote") {
    if (target.is_admin_owner === true) {
      return NextResponse.json({ error: "Ese usuario ya es el administrador original." }, { status: 400 });
    }

    if (target.role === "admin") {
      return NextResponse.json({ error: "Ese usuario ya es co-admin." }, { status: 400 });
    }

    if (target.deleted_at) {
      return NextResponse.json({ error: "No se puede ascender una cuenta eliminada." }, { status: 400 });
    }

    if (target.banned_at || target.active !== true) {
      return NextResponse.json(
        { error: "Desbaneá/reactivá la cuenta antes de ascenderla." },
        { status: 400 },
      );
    }

    await withTransaction(async (client) => {
      await client.query(
        `
          UPDATE users
          SET role = 'admin',
              active = TRUE,
              banned_at = NULL,
              banned_reason = NULL,
              banned_by = NULL,
              is_admin_owner = FALSE
          WHERE id = $1
        `,
        [target.id],
      );

      await client.query(
        `
          INSERT INTO admin_designations(admin_user_id, designated_by)
          VALUES($1, $2)
          ON CONFLICT (admin_user_id)
          DO UPDATE SET
            designated_by = EXCLUDED.designated_by,
            designated_at = NOW()
        `,
        [target.id, actor.id],
      );

      await client.query("DELETE FROM sessions WHERE user_id = $1", [target.id]);
    });

    return NextResponse.json({ ok: true, action: "promote" });
  }

  return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
}

export async function DELETE(_request, { params }) {
  const actor = await getSession();

  if (!isAdmin(actor)) {
    return NextResponse.json({ error: "Solo administradores." }, { status: 403 });
  }

  const { id } = await params;
  const target = await getTarget(String(id || ""));

  if (!target) {
    return NextResponse.json({ error: "Usuario inexistente." }, { status: 404 });
  }

  const hierarchyError = blockedByHierarchy(actor, target);
  if (hierarchyError) {
    return NextResponse.json({ error: hierarchyError }, { status: 403 });
  }

  if (String(actor.id) === String(target.id)) {
    return NextResponse.json(
      { error: "No podés eliminar tu propia cuenta administrativa." },
      { status: 400 },
    );
  }

  await withTransaction(async (client) => {
    await client.query("DELETE FROM sessions WHERE user_id = $1", [target.id]);

    await client.query(
      `
        UPDATE users
        SET active = FALSE,
            deleted_at = NOW(),
            banned_at = COALESCE(banned_at, NOW()),
            banned_reason = COALESCE(banned_reason, 'Cuenta eliminada por administración'),
            banned_by = COALESCE(banned_by, $2)
        WHERE id = $1
      `,
      [target.id, actor.id],
    );

    await client.query(
      `
        UPDATE products
        SET active = FALSE,
            moderation_status = 'removed',
            moderated_by = $2,
            moderated_at = NOW()
        WHERE seller_id = $1
      `,
      [target.id, actor.id],
    );
  });

  return NextResponse.json({ ok: true, action: "delete" });
}
