"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import { formatARS } from "../../../lib/catalog-ui";

function statusLabel(status) {
  if (status === "under_review") return "En revisión";
  if (status === "removed") return "Eliminado";
  return "Publicado";
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/products", { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudieron cargar los productos.");
      return;
    }

    setProducts(data.products || []);
    setError("");
  }

  useEffect(() => {
    load();
  }, []);

  async function action(product, actionName) {
    const response = await fetch(`/api/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: actionName }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo moderar el producto.");
      return;
    }

    setMessage("Producto actualizado.");
    load();
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-extrabold">Productos de vendedores</h1>
        <p className="mt-2 text-gray-600">
          Monitorización de publicaciones de distribuidoras/PyME.
        </p>

        {error ? <p className="mt-4 text-red-600">{error}</p> : null}
        {message ? <p className="mt-4 text-gray-600">{message}</p> : null}

        <div className="mt-8 space-y-4">
          {products.map((product) => (
            <article
              key={product.id}
              className="border rounded-lg p-5 flex flex-col md:flex-row gap-5"
            >
              <img
                src={product.image_url || "/logo-blanco.png"}
                alt={product.name}
                className="w-full md:w-40 h-40 object-cover rounded bg-gray-100"
              />

              <div className="flex-1">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-xl">{product.name}</h2>
                    <p className="text-sm text-gray-600">
                      {product.seller_name}
                      {product.seller_email ? ` · ${product.seller_email}` : ""}
                    </p>
                    <p className="text-sm text-gray-600">
                      {product.category}
                      {product.subcategory ? ` · ${product.subcategory}` : ""}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="border rounded px-3 py-1 text-sm">
                      {statusLabel(product.moderation_status)}
                    </span>
                    <p className="mt-2 text-sm text-gray-600">
                      Denuncias: {product.report_count}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-gray-700">{product.description}</p>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>{formatARS(product.price_client)}</span>
                  <span>Stock: {product.stock}</span>
                  <span>
                    ★ {Number(product.average_rating || 0).toFixed(1)} ({product.review_count})
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {product.active && product.moderation_status === "approved" ? (
                    <Link
                      href={`/producto/${product.id}`}
                      className="border px-4 py-2 rounded"
                    >
                      Ver
                    </Link>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => action(product, "approve")}
                    className="border px-4 py-2 rounded"
                  >
                    Aprobar / publicar
                  </button>

                  <button
                    type="button"
                    onClick={() => action(product, "review")}
                    className="border px-4 py-2 rounded"
                  >
                    Poner en revisión
                  </button>

                  <button
                    type="button"
                    onClick={() => action(product, "remove")}
                    className="bg-red-600 text-white px-4 py-2 rounded"
                  >
                    Eliminar de venta
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
