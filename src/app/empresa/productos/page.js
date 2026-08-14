"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import { formatARS } from "../../../lib/catalog-ui";

function statusLabel(status, active) {
  if (status === "removed") return "Eliminado";
  if (status === "under_review") return "En revisión";
  if (!active) return "Oculto";
  return "Publicado";
}

export default function CompanyProductsPage() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/company/products", { cache: "no-store" });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudieron cargar los productos.");
      setLoading(false);
      return;
    }

    setProducts(data.products || []);
    setError("");
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(product) {
    if (!confirm(`¿Eliminar "${product.name}" de la venta?`)) return;

    const response = await fetch(`/api/company/products/${product.id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo eliminar el producto.");
      return;
    }

    load();
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/perfil" className="text-sm text-gray-600">
              ← Volver al perfil
            </Link>
            <h1 className="mt-3 text-4xl font-extrabold">Mis productos</h1>
            <p className="mt-2 text-gray-600">
              Publicaciones de tu distribuidora/PyME.
            </p>
          </div>

          <Link
            href="/empresa/productos/nuevo"
            className="bg-black text-white px-5 py-3 rounded font-semibold"
          >
            + Agregar producto
          </Link>
        </div>

        {error ? <p className="mt-6 text-red-600">{error}</p> : null}
        {loading ? <p className="mt-8 text-gray-600">Cargando...</p> : null}

        <div className="mt-8 space-y-4">
          {products.map((product) => (
            <article
              key={product.id}
              className="border rounded-lg p-5 flex flex-col md:flex-row gap-5"
            >
              <img
                src={product.image_url || "/logo-blanco.png"}
                alt={product.name}
                className="w-full md:w-36 h-36 object-cover rounded bg-gray-100"
              />

              <div className="flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">{product.name}</h2>
                    <p className="text-sm text-gray-600">
                      {product.category}
                      {product.subcategory ? ` · ${product.subcategory}` : ""}
                    </p>
                  </div>

                  <span className="border rounded px-3 py-1 text-sm">
                    {statusLabel(product.moderation_status, product.active)}
                  </span>
                </div>

                <p className="mt-3 text-sm text-gray-700 line-clamp-2">
                  {product.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>Precio: {formatARS(product.price_client)}</span>
                  <span>Stock: {product.stock}</span>
                  <span>
                    ★ {Number(product.average_rating || 0).toFixed(1)} ({product.review_count})
                  </span>
                  <span>Denuncias: {product.report_count}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  {product.active && product.moderation_status === "approved" ? (
                    <Link
                      href={`/producto/${product.id}`}
                      className="border px-4 py-2 rounded font-semibold"
                    >
                      Ver publicación
                    </Link>
                  ) : null}

                  {product.moderation_status !== "removed" ? (
                    <button
                      type="button"
                      onClick={() => remove(product)}
                      className="text-red-600 border px-4 py-2 rounded"
                    >
                      Quitar de la venta
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))}

          {!loading && !products.length ? (
            <div className="border rounded-lg p-8 text-center text-gray-600">
              Todavía no publicaste productos.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
