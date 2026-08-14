"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../../components/Navbar";

const CATEGORIES = [
  ["general", "General"],
  ["hombre", "Hombre"],
  ["mujer", "Mujer"],
  ["calzado", "Calzado"],
  ["accesorios", "Accesorios"],
  ["otros", "Otros"],
];

const SUBCATEGORIES = [
  "Zapatillas",
  "Remeras",
  "Pantalones",
  "Shorts",
  "Buzos",
  "Camperas",
  "Vestidos",
  "Tops",
  "Mochilas",
  "Auriculares",
  "Botellas",
  "Otros",
];

export default function NewProductPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    category: "general",
    subcategory: "Otros",
    description: "",
    priceClient: "",
    priceDistributor: "",
    stock: "",
    sizes: "",
    colors: "",
    isOffer: false,
  });

  const [images, setImages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const body = new FormData();

      for (const [key, value] of Object.entries(form)) {
        body.append(key, String(value));
      }

      for (const image of images) {
        body.append("images", image);
      }

      const response = await fetch("/api/company/products", {
        method: "POST",
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo publicar el producto.");
      }

      router.push("/empresa/productos");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <section className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/empresa/productos" className="text-sm text-gray-600">
          ← Volver a mis productos
        </Link>

        <h1 className="mt-4 text-4xl font-extrabold">Agregar producto</h1>
        <p className="mt-2 text-gray-600">
          Podés usar hashtags en la descripción, por ejemplo #running #verano.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label className="block font-semibold mb-2">Nombre</label>
            <input
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
              className="w-full border p-3 rounded"
              placeholder="Ej: Zapatillas Running Pro"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-2">Categoría</label>
              <select
                value={form.category}
                onChange={(event) => set("category", event.target.value)}
                className="w-full border p-3 rounded"
              >
                {CATEGORIES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-2">
                Tipo de producto
              </label>
              <select
                value={form.subcategory}
                onChange={(event) => set("subcategory", event.target.value)}
                className="w-full border p-3 rounded"
              >
                {SUBCATEGORIES.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-2">Descripción</label>
            <textarea
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
              className="w-full border p-3 rounded"
              rows="6"
              placeholder="Descripción del producto. Los #hashtags se guardan automáticamente."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-2">
                Precio cliente (ARS)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.priceClient}
                onChange={(event) => set("priceClient", event.target.value)}
                className="w-full border p-3 rounded"
                required
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">
                Precio distribuidora
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.priceDistributor}
                onChange={(event) =>
                  set("priceDistributor", event.target.value)
                }
                className="w-full border p-3 rounded"
                placeholder="Opcional"
              />
            </div>

            <div>
              <label className="block font-semibold mb-2">Stock</label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(event) => set("stock", event.target.value)}
                className="w-full border p-3 rounded"
                required
              />
            </div>
          </div>

          <div className="border rounded-lg p-5">
            <h2 className="font-bold text-xl">Opciones de compra</h2>
            <p className="mt-1 text-sm text-gray-600">
              Dejalas vacías si este producto no necesita talle o color.
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-2">
                  Talles separados por coma
                </label>
                <input
                  value={form.sizes}
                  onChange={(event) => set("sizes", event.target.value)}
                  className="w-full border p-3 rounded"
                  placeholder="S, M, L, XL"
                />
              </div>

              <div>
                <label className="block font-semibold mb-2">
                  Colores separados por coma
                </label>
                <input
                  value={form.colors}
                  onChange={(event) => set("colors", event.target.value)}
                  className="w-full border p-3 rounded"
                  placeholder="Negro, Blanco, Rojo"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Fotos del producto
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(event) =>
                setImages(Array.from(event.target.files || []).slice(0, 5))
              }
              className="w-full border p-3 rounded"
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Hasta 5 imágenes. JPG, PNG o WEBP. Máximo 5 MB cada una.
            </p>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.isOffer}
              onChange={(event) => set("isOffer", event.target.checked)}
            />
            <span>Marcar como oferta</span>
          </label>

          {error ? <p className="text-red-600">{error}</p> : null}

          <button
            disabled={loading}
            className="w-full bg-yellow-400 text-black px-6 py-3 rounded font-semibold"
          >
            {loading ? "Publicando..." : "Publicar producto"}
          </button>
        </form>
      </section>
    </main>
  );
}
