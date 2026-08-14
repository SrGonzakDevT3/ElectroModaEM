"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../../components/Navbar";

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/reports", { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudieron cargar las denuncias.");
      return;
    }

    setReports(data.reports || []);
    setError("");
  }

  useEffect(() => {
    load();
  }, []);

  async function update(report, status, removeProduct = false) {
    const response = await fetch(`/api/admin/reports/${report.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status, removeProduct }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo actualizar la denuncia.");
      return;
    }

    setMessage("Denuncia actualizada.");
    load();
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-extrabold">Denuncias de productos</h1>
        <p className="mt-2 text-gray-600">
          Feed de publicaciones reportadas por clientes.
        </p>

        {error ? <p className="mt-4 text-red-600">{error}</p> : null}
        {message ? <p className="mt-4 text-gray-600">{message}</p> : null}

        <div className="mt-8 space-y-4">
          {reports.map((report) => (
            <article key={report.id} className="border rounded-lg p-5">
              <div className="flex flex-col md:flex-row gap-5">
                <img
                  src={report.image_url || "/logo-blanco.png"}
                  alt={report.product_name}
                  className="w-full md:w-32 h-32 object-cover rounded bg-gray-100"
                />

                <div className="flex-1">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-xl">
                        #{report.id} · {report.product_name}
                      </h2>
                      <p className="text-sm text-gray-600">
                        Denunció @{report.reporter_username} · vendedor:{" "}
                        {report.seller_name}
                      </p>
                    </div>

                    <span className="border rounded px-3 py-1 text-sm h-fit">
                      {report.status}
                    </span>
                  </div>

                  <p className="mt-3 font-semibold">{report.reason}</p>

                  {report.details ? (
                    <p className="mt-2 whitespace-pre-wrap text-gray-700">
                      {report.details}
                    </p>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={`/producto/${report.product_id}`}
                      className="border px-4 py-2 rounded"
                    >
                      Ver producto
                    </Link>

                    <button
                      type="button"
                      onClick={() => update(report, "reviewing")}
                      className="border px-4 py-2 rounded"
                    >
                      Poner en revisión
                    </button>

                    <button
                      type="button"
                      onClick={() => update(report, "dismissed")}
                      className="border px-4 py-2 rounded"
                    >
                      Descartar denuncia
                    </button>

                    <button
                      type="button"
                      onClick={() => update(report, "actioned", true)}
                      className="bg-red-600 text-white px-4 py-2 rounded"
                    >
                      Eliminar producto
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}

          {!reports.length ? (
            <div className="border rounded-lg p-8 text-center text-gray-600">
              No hay denuncias registradas.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
