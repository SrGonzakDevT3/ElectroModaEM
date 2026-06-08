// Directiva fundamental en Next.js App Router para indicar que este componente 
// maneja estado local (useState) o eventos del DOM, por lo que debe renderizarse en el cliente.
"use client";

import Image from "next/image";
import { useState } from "react";

// Función utilitaria para limpiar caracteres no numéricos y dar formato de moneda
// utilizando el estándar de formato regional de Argentina (es-AR).
function formatPrice(price) {
  if (price == null) return "";
  if (typeof price === "number") return new Intl.NumberFormat("es-AR").format(price);
  
  // Extrae solo los dígitos por si el precio viene con símbolos (ej. "$35.000")
  const digits = String(price).replace(/\D/g, "");
  if (!digits) return String(price);
  return new Intl.NumberFormat("es-AR").format(parseInt(digits, 10));
}

// Componente individual de Tarjeta de Producto, recibe propiedades (props) desde el componente padre (Home)
export default function ProductCard({ nombre, precio, imagen }) {
  // Estado que maneja la ruta de la imagen. Permite cambiar la fuente en tiempo real si hay un error.
  const [src, setSrc] = useState(imagen || "/placeholder.png");
  // Ejecutamos la función de formato sobre el precio recibido
  const precioFormateado = formatPrice(precio);

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden relative">
      {/* Contenedor con relación de aspecto fija (4:3) y overflow oculto para mantener uniformidad visual */}
      <div className="w-full relative bg-gray-100" style={{ aspectRatio: "4 / 3" }}>
        <Image
          src={src}
          alt={nombre}
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          style={{ objectFit: "cover" }}
          // onError: Si la imagen falla al cargar (ej. no existe el archivo), actualiza el estado (src) a un placeholder
          onError={() => setSrc("/placeholder.png")}
          priority={false} // Imagen secundaria, no bloquea el renderizado crítico
        />
      </div>

      {/* Contenedor de la información del producto (Título, Precio y Botón de compra) */}
      <div className="p-4">
        {/* Título truncado (truncate) para evitar que rompa el diseño si el nombre es muy largo */}
        <h4 className="font-semibold text-gray-900 truncate">{nombre}</h4>

        <div className="mt-3 flex items-center justify-between">
          {/* Bloque visual del precio con la etiqueta de color acento */}
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