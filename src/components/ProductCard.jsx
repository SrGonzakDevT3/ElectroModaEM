"use client";

import Image from "next/image";
import { useState } from "react";

function formatPrice(price) {
  if (price == null) return "";
  if (typeof price === "number") return new Intl.NumberFormat("es-AR").format(price);
  const digits = String(price).replace(/\D/g, "");
  if (!digits) return String(price);
  return new Intl.NumberFormat("es-AR").format(parseInt(digits, 10));
}

export default function ProductCard({ nombre, precio, imagen }) {
  const [src, setSrc] = useState(imagen || "/placeholder.png");
  const precioFormateado = formatPrice(precio);

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden relative">
      {/* Contenedor con relación de aspecto fija (4:3) y overflow oculto */}
      <div className="w-full relative bg-gray-100" style={{ aspectRatio: "4 / 3" }}>
        <Image
          src={src}
          alt={nombre}
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          style={{ objectFit: "cover" }}
          onError={() => setSrc("/placeholder.png")}
          priority={false}
        />
      </div>

      <div className="p-4">
        <h4 className="font-semibold text-gray-900 truncate">{nombre}</h4>

        <div className="mt-3 flex items-center justify-between">
          <div className="inline-flex items-baseline gap-2 bg-yellow-400 text-black px-3 py-1 rounded-md font-bold">
            <span className="text-sm">$</span>
            <span className="text-lg">{precioFormateado}</span>
          </div>

          <button className="bg-black text-white px-3 py-1 rounded hover:opacity-90">Agregar</button>
        </div>
      </div>
    </article>
  );
}
