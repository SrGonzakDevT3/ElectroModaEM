"use client";

import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";

function roleLabel(user) {
  if (user.is_admin_owner) return "Admin original";
  if (user.role === "admin") return "Co-admin";
  if (user.role === "company") return "Distribuidora / PyME";
  return "Cliente";
}

function accountStatus(user) {
  if (user.deleted_at) return "Eliminado";
  if (user.banned_at) return "Baneado";
  if (!user.active) return "Inactivo";
  return "Activo";
}

export default function AdminUsuarios() {
  const [users, setUsers] = useState([]);
  const [actor, setActor] = useState(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (role) params.set("role", role);

    const response = await fetch(`/api/admin/users?${params}`, {
      cache: "no-store",
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudieron cargar los usuarios.");
      return;
    }

    setUsers(data.users || []);
    setActor(data.actor || null);
    setError("");
  }

  useEffect(() => {
    load();
  }, [role]);

  async function action(user, actionName) {
    setError("");
    setMessage("");

    let reason = "";

    if (actionName === "ban") {
      reason = prompt("Motivo del baneo:", "Incumplimiento de normas") || "";
      if (!reason.trim()) return;
    }

    if (actionName === "promote") {
      if (
        !confirm(
          `¿Ascender a @${user.username} a co-admin? Tendrá permisos de moderación.`,
        )
      ) {
        return;
      }
    }

    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: actionName, reason }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo realizar la acción.");
      return;
    }

    setMessage("Cambio aplicado.");
    load();
  }

  async function remove(user) {
    if (
      !confirm(
        `¿Eliminar la cuenta de @${user.username}? La cuenta dejará de poder ingresar y sus productos se quitarán de venta.`,
      )
    ) {
      return;
    }

    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo eliminar la cuenta.");
      return;
    }

    setMessage("Cuenta eliminada.");
    load();
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-extrabold">Usuarios y permisos</h1>
        <p className="mt-2 text-gray-600">
          Moderación de clientes, distribuidoras y co-admins.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            load();
          }}
          className="mt-6 flex flex-col md:flex-row gap-3"
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="flex-1 border p-3 rounded"
            placeholder="Buscar usuario, email, empresa o DNI"
          />

          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="border p-3 rounded"
          >
            <option value="">Todos los roles</option>
            <option value="customer">Clientes</option>
            <option value="company">Distribuidoras / PyME</option>
            <option value="admin">Administradores</option>
          </select>

          <button className="bg-black text-white px-5 py-3 rounded font-semibold">
            Buscar
          </button>
        </form>

        {error ? <p className="mt-4 text-red-600">{error}</p> : null}
        {message ? <p className="mt-4 text-gray-600">{message}</p> : null}

        <div className="mt-8 space-y-4">
          {users.map((user) => {
            const protectedOwner = user.is_admin_owner === true;
            const adminBlocked =
              user.role === "admin" &&
              !protectedOwner &&
              actor?.isAdminOwner !== true;

            return (
              <article key={user.id} className="border rounded-lg p-5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-xl">
                        {user.first_name} {user.last_name}
                      </h2>
                      <span className="border rounded px-2 py-1 text-xs">
                        {roleLabel(user)}
                      </span>
                      <span className="border rounded px-2 py-1 text-xs">
                        {accountStatus(user)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      @{user.username} · {user.email} · DNI {user.dni}
                    </p>

                    {user.business_name ? (
                      <p className="mt-1 text-sm text-gray-600">
                        Empresa: {user.business_name} · CUIT {user.cuit}
                      </p>
                    ) : null}

                    <p className="mt-2 text-sm text-gray-600">
                      Productos: {user.product_count} · Consultas de soporte:{" "}
                      {user.support_ticket_count}
                    </p>

                    {user.banned_reason ? (
                      <p className="mt-2 text-sm text-red-600">
                        Motivo: {user.banned_reason}
                      </p>
                    ) : null}
                  </div>

                  {!protectedOwner && !adminBlocked && !user.deleted_at ? (
                    <div className="flex flex-wrap gap-2">
                      {user.banned_at ? (
                        <button
                          type="button"
                          onClick={() => action(user, "unban")}
                          className="border px-3 py-2 rounded"
                        >
                          Desbanear
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => action(user, "ban")}
                          className="border px-3 py-2 rounded text-red-600"
                        >
                          Banear
                        </button>
                      )}

                      {user.role !== "admin" ? (
                        <button
                          type="button"
                          onClick={() => action(user, "promote")}
                          className="border px-3 py-2 rounded"
                        >
                          Ascender a co-admin
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => remove(user)}
                        className="bg-red-600 text-white px-3 py-2 rounded"
                      >
                        Eliminar
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
