"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { formatARS } from "../../lib/catalog-ui";

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const response = await fetch("/api/cart", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo cargar el carrito");
      }

      setItems(data.items || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const total = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0,
  );

  async function change(cartItemId, quantity) {
    const response = await fetch("/api/cart", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cartItemId, quantity }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo actualizar");
      return;
    }

    load();
  }

  async function remove(cartItemId) {
    const response = await fetch("/api/cart", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ cartItemId }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo quitar");
      return;
    }

    load();
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <section className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-extrabold">Mi carrito</h1>

        {error ? (
          <div className="mt-6 bg-gray-50 border rounded p-6">
            <p className="text-red-600">{error}</p>
            <Link
              href="/login"
              className="inline-block mt-4 bg-black text-white px-5 py-2 rounded font-semibold"
            >
              Iniciar sesión
            </Link>
          </div>
        ) : null}

        {loading ? (
          <p className="mt-8 text-gray-600">Cargando...</p>
        ) : (
          <>
            <div className="mt-8 space-y-4">
              {items.map((item) => (
                <div
                  key={item.cart_item_id}
                  className="flex items-center gap-4 border rounded p-4"
                >
                  <img
                    src={item.image_url || "/logo-blanco.png"}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded bg-gray-100"
                  />

                  <div className="flex-1">
                    <div className="font-semibold">{item.name}</div>

                    <div className="text-sm text-gray-600">
                      Precio unitario: {formatARS(Number(item.price))}
                    </div>

                    {item.selected_size || item.selected_color ? (
                      <div className="mt-1 text-sm text-gray-600">
                        {item.selected_size ? `Talle: ${item.selected_size}` : ""}
                        {item.selected_size && item.selected_color ? " · " : ""}
                        {item.selected_color ? `Color: ${item.selected_color}` : ""}
                      </div>
                    ) : null}

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() =>
                          change(item.cart_item_id, Number(item.quantity) - 1)
                        }
                        disabled={Number(item.quantity) <= 1}
                        className="border px-2 rounded"
                      >
                        −
                      </button>

                      <span className="min-w-6 text-center">{item.quantity}</span>

                      <button
                        onClick={() =>
                          change(item.cart_item_id, Number(item.quantity) + 1)
                        }
                        disabled={
                          Number(item.quantity) >= 99 ||
                          Number(item.quantity) >= Number(item.stock)
                        }
                        className="border px-2 rounded"
                      >
                        +
                      </button>

                      <button
                        onClick={() => remove(item.cart_item_id)}
                        className="ml-2 text-sm text-red-600"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>

                  <div className="font-bold">
                    {formatARS(Number(item.price) * Number(item.quantity))}
                  </div>
                </div>
              ))}
            </div>

            {!items.length ? (
              <div className="mt-8 border rounded p-8 text-center text-gray-600">
                Tu carrito está vacío.{" "}
                <Link href="/" className="font-semibold text-black">
                  Seguir comprando
                </Link>
              </div>
            ) : (
              <div className="mt-8 text-right">
                <p className="text-xl font-bold">Total: {formatARS(total)}</p>
                <button className="mt-4 bg-yellow-400 text-black px-6 py-3 rounded font-semibold">
                  Continuar compra
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
