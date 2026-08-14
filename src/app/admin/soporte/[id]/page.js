"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "../../../../components/Navbar";

export default function AdminTicket() {
  const { id } = useParams();
  const ticketId = Array.isArray(id) ? id[0] : id;

  const [data, setData] = useState(null);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  async function load() {
    if (!ticketId) return;

    const response = await fetch(
      `/api/support/tickets/${encodeURIComponent(ticketId)}/messages`,
      { cache: "no-store" },
    );
    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "No se pudo cargar la consulta.");
      return;
    }

    setError("");
    setData(result);
  }

  useEffect(() => {
    load();
  }, [ticketId]);

  async function reply(event) {
    event.preventDefault();

    const response = await fetch(
      `/api/support/tickets/${encodeURIComponent(ticketId)}/messages`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "No se pudo responder.");
      return;
    }

    setBody("");
    await load();
  }

  async function changeStatus(status) {
    const response = await fetch(
      `/api/support/tickets/${encodeURIComponent(ticketId)}/messages`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "No se pudo actualizar el estado.");
      return;
    }

    await load();
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <section className="max-w-4xl mx-auto px-6 py-16">
        <Link
          href="/admin/soporte"
          className="text-sm text-gray-600"
        >
          ← Volver al feed
        </Link>

        <h1 className="mt-4 text-4xl font-extrabold">
          {data?.ticket?.subject || `Consulta #${ticketId || ""}`}
        </h1>

        {error ? <p className="mt-4 text-red-600">{error}</p> : null}

        <div className="mt-8 space-y-3">
          {data?.messages?.map((message) => (
            <div key={message.id} className="border rounded-lg p-4">
              <p className="text-sm font-semibold">
                @{message.username} · {message.role}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{message.body}</p>
            </div>
          ))}
        </div>

        {data ? (
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => changeStatus("in_progress")}
              className="border px-3 py-2 rounded"
            >
              En progreso
            </button>
            <button
              type="button"
              onClick={() => changeStatus("resolved")}
              className="border px-3 py-2 rounded"
            >
              Resolver
            </button>
            <button
              type="button"
              onClick={() => changeStatus("closed")}
              className="border px-3 py-2 rounded"
            >
              Cerrar
            </button>
          </div>
        ) : null}

        <form onSubmit={reply} className="mt-8">
          <textarea
            className="w-full border p-3 rounded"
            rows="5"
            placeholder="Responder al usuario"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
          />
          <button className="mt-3 bg-black text-white px-5 py-3 rounded font-semibold">
            Responder
          </button>
        </form>
      </section>
    </main>
  );
}
