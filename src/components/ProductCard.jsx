"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { formatARS } from "../lib/catalog-ui";

function Stars({ value = 0, count = 0 }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <span className="text-sm text-gray-600" title={`${value || 0} de 5`}>
      <span className="text-yellow-500">{"★".repeat(rounded)}{"☆".repeat(5 - rounded)}</span>
      {count ? <span className="ml-1">({count})</span> : null}
    </span>
  );
}

export default function ProductCard({
  id,
  nombre,
  precio,
  imagen,
  averageRating = 0,
  reviewCount = 0,
  hasOptions = false,
  sellerName = null,
}) {
  const [src, setSrc] = useState(imagen || "/logo-blanco.png");
  const [message, setMessage] = useState("");

  async function addToCart() {
    setMessage("");

    if (!id) {
      setMessage("Producto sin ID");
      return;
    }

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId: id, quantity: 1 }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.error || "Iniciá sesión para agregar productos");
        return;
      }

      setMessage("Agregado al carrito");
    } catch {
      setMessage("No se pudo actualizar el carrito");
    }
  }

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden relative">
      <Link
        href={`/producto/${id}`}
        className="block w-full relative bg-gray-100"
        style={{ aspectRatio: "4 / 3" }}
      >
        <Image
          src={src}
          alt={nombre}
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          style={{ objectFit: "cover" }}
          onError={() => setSrc("/logo-blanco.png")}
        />
      </Link>

      <div className="p-4">
        <Link href={`/producto/${id}`}>
          <h4 className="font-semibold text-gray-900 truncate">{nombre}</h4>
        </Link>

        {sellerName ? (
          <p className="mt-1 text-xs text-gray-500">Vendido por {sellerName}</p>
        ) : null}

        <div className="mt-2">
          <Stars value={averageRating} count={reviewCount} />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="inline-flex items-baseline gap-2 bg-yellow-400 text-black px-3 py-1 rounded-md font-bold">
            <span className="text-lg">{formatARS(precio)}</span>
          </div>

          {hasOptions ? (
            <Link
              href={`/producto/${id}`}
              className="bg-black text-white px-3 py-1 rounded hover:opacity-90"
            >
              Elegir
            </Link>
          ) : (
            <button
              type="button"
              onClick={addToCart}
              className="bg-black text-white px-3 py-1 rounded hover:opacity-90"
            >
              Agregar
            </button>
          )}
        </div>

        <Link
          href={`/producto/${id}`}
          className="inline-block mt-3 text-sm font-semibold text-gray-700"
        >
          Ver producto →
        </Link>

        {message ? (
          <p className="mt-2 text-xs text-gray-600" aria-live="polite">
            {message}
          </p>
        ) : null}
      </div>
    </article>
  );
}
