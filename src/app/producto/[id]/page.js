"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import { formatARS } from "../../../lib/catalog-ui";

const REPORT_REASONS = [
  "Información falsa",
  "Producto prohibido",
  "Imagen inapropiada",
  "Estafa o publicación engañosa",
  "Otro",
];

function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1" aria-label="Puntuación">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="text-3xl"
          aria-label={`${star} estrella${star === 1 ? "" : "s"}`}
        >
          <span className={star <= value ? "text-yellow-500" : "text-gray-300"}>
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

function Stars({ value }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <span className="text-yellow-500">
      {"★".repeat(rounded)}
      <span className="text-gray-300">{"★".repeat(5 - rounded)}</span>
    </span>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const productId = Array.isArray(id) ? id[0] : id;

  const [data, setData] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState("");
  const [reportMessage, setReportMessage] = useState("");

  async function load() {
    if (!productId) return;

    try {
      const response = await fetch(
        `/api/products/${encodeURIComponent(productId)}`,
        { cache: "no-store" },
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "No se pudo cargar el producto.");
      }

      setData(result);
      setSelectedImage(result.images?.[0] || result.product.image_url || "");

      if (result.ownReview) {
        setRating(Number(result.ownReview.rating));
        setComment(result.ownReview.comment || "");
      }

      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, [productId]);

  const product = data?.product;
  const sizes = data?.options?.sizes || [];
  const colors = data?.options?.colors || [];

  const needsSize = Boolean(product?.allow_sizes && sizes.length);
  const needsColor = Boolean(product?.allow_colors && colors.length);

  const canAdd = useMemo(() => {
    if (!product) return false;
    if (needsSize && !selectedSize) return false;
    if (needsColor && !selectedColor) return false;
    return true;
  }, [product, needsSize, selectedSize, needsColor, selectedColor]);

  async function addToCart() {
    setMessage("");

    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productId,
        quantity: 1,
        selectedSize,
        selectedColor,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "No se pudo agregar al carrito.");
      return;
    }

    setMessage("Agregado al carrito.");
  }

  async function submitReview(event) {
    event.preventDefault();
    setReviewMessage("");

    const response = await fetch(
      `/api/products/${encodeURIComponent(productId)}/reviews`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      setReviewMessage(result.error || "No se pudo guardar la reseña.");
      return;
    }

    setReviewMessage("Tu puntuación fue guardada.");
    await load();
  }

  async function deleteReview() {
    const response = await fetch(
      `/api/products/${encodeURIComponent(productId)}/reviews`,
      { method: "DELETE" },
    );

    const result = await response.json();

    if (!response.ok) {
      setReviewMessage(result.error || "No se pudo eliminar la reseña.");
      return;
    }

    setComment("");
    setRating(5);
    setReviewMessage("Reseña eliminada.");
    await load();
  }

  async function submitReport(event) {
    event.preventDefault();
    setReportMessage("");

    const response = await fetch(
      `/api/products/${encodeURIComponent(productId)}/reports`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reason: reportReason,
          details: reportDetails,
        }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      setReportMessage(result.error || "No se pudo enviar la denuncia.");
      return;
    }

    setReportDetails("");
    setReportMessage("Denuncia enviada a administración.");
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <section className="max-w-6xl mx-auto px-6 py-12">
        {error ? (
          <div className="border rounded-lg p-8">
            <p className="text-red-600">{error}</p>
            <Link href="/" className="inline-block mt-4 font-semibold">
              ← Volver
            </Link>
          </div>
        ) : null}

        {!product && !error ? (
          <p className="text-gray-600">Cargando producto...</p>
        ) : null}

        {product ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <div className="border rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={selectedImage || product.image_url || "/logo-blanco.png"}
                    alt={product.name}
                    className="w-full object-cover"
                    style={{ aspectRatio: "4 / 3" }}
                  />
                </div>

                {data.images?.length > 1 ? (
                  <div className="mt-3 flex gap-3 overflow-x-auto">
                    {data.images.map((image) => (
                      <button
                        key={image}
                        type="button"
                        onClick={() => setSelectedImage(image)}
                        className="border rounded overflow-hidden shrink-0"
                      >
                        <img
                          src={image}
                          alt=""
                          className="w-20 h-20 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  {product.category}
                  {product.subcategory ? ` · ${product.subcategory}` : ""}
                </p>

                <h1 className="mt-2 text-4xl font-extrabold">{product.name}</h1>

                <div className="mt-3 flex items-center gap-2">
                  <Stars value={product.average_rating} />
                  <span className="text-sm text-gray-600">
                    {Number(product.average_rating || 0).toFixed(1)} ·{" "}
                    {product.review_count} reseña(s)
                  </span>
                </div>

                <p className="mt-3 text-sm text-gray-600">
                  Vendido por <strong>{product.seller_name}</strong>
                </p>

                <div className="mt-5 inline-flex bg-yellow-400 text-black px-4 py-2 rounded font-bold text-2xl">
                  {formatARS(product.price_for_user)}
                </div>

                <p className="mt-6 whitespace-pre-wrap text-gray-700">
                  {product.description}
                </p>

                {data.tags?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {data.tags.map((tag) => (
                      <span
                        key={tag}
                        className="border rounded-full px-3 py-1 text-sm text-gray-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                {needsSize ? (
                  <div className="mt-6">
                    <label className="block font-semibold mb-2">Talle</label>
                    <select
                      value={selectedSize}
                      onChange={(event) => setSelectedSize(event.target.value)}
                      className="w-full border p-3 rounded"
                    >
                      <option value="">Elegí un talle</option>
                      {sizes.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {needsColor ? (
                  <div className="mt-4">
                    <label className="block font-semibold mb-2">Color</label>
                    <select
                      value={selectedColor}
                      onChange={(event) => setSelectedColor(event.target.value)}
                      className="w-full border p-3 rounded"
                    >
                      <option value="">Elegí un color</option>
                      {colors.map((color) => (
                        <option key={color} value={color}>
                          {color}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={addToCart}
                  disabled={!canAdd}
                  className="mt-6 bg-black text-white px-6 py-3 rounded font-semibold disabled:opacity-50"
                >
                  Agregar al carrito
                </button>

                {message ? (
                  <p className="mt-3 text-sm text-gray-600">{message}</p>
                ) : null}

                {data.viewerRole === "customer" ? (
                  <button
                    type="button"
                    onClick={() => setReportOpen((value) => !value)}
                    className="mt-6 text-sm text-red-600"
                  >
                    Denunciar producto
                  </button>
                ) : null}

                {reportOpen && data.viewerRole === "customer" ? (
                  <form
                    onSubmit={submitReport}
                    className="mt-4 border rounded-lg p-4 space-y-3"
                  >
                    <h2 className="font-bold">Denunciar publicación</h2>

                    <select
                      value={reportReason}
                      onChange={(event) => setReportReason(event.target.value)}
                      className="w-full border p-3 rounded"
                    >
                      {REPORT_REASONS.map((reason) => (
                        <option key={reason}>{reason}</option>
                      ))}
                    </select>

                    <textarea
                      value={reportDetails}
                      onChange={(event) => setReportDetails(event.target.value)}
                      rows="4"
                      className="w-full border p-3 rounded"
                      placeholder="Detalles opcionales"
                    />

                    <button className="bg-red-600 text-white px-4 py-2 rounded">
                      Enviar denuncia
                    </button>

                    {reportMessage ? (
                      <p className="text-sm text-gray-600">{reportMessage}</p>
                    ) : null}
                  </form>
                ) : null}
              </div>
            </div>

            <section className="mt-14">
              <h2 className="text-3xl font-bold">Opiniones</h2>

              {data.viewerRole === "customer" ? (
                <form
                  onSubmit={submitReview}
                  className="mt-6 border rounded-lg p-6"
                >
                  <h3 className="font-bold text-xl">
                    {data.ownReview ? "Editar mi reseña" : "Puntuar producto"}
                  </h3>

                  <div className="mt-3">
                    <StarPicker value={rating} onChange={setRating} />
                  </div>

                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    rows="4"
                    className="mt-4 w-full border p-3 rounded"
                    placeholder="Comentario sobre el producto (opcional)"
                  />

                  <div className="mt-3 flex gap-3">
                    <button className="bg-black text-white px-5 py-2 rounded font-semibold">
                      Guardar reseña
                    </button>

                    {data.ownReview ? (
                      <button
                        type="button"
                        onClick={deleteReview}
                        className="border px-5 py-2 rounded"
                      >
                        Eliminar mi reseña
                      </button>
                    ) : null}
                  </div>

                  {reviewMessage ? (
                    <p className="mt-3 text-sm text-gray-600">{reviewMessage}</p>
                  ) : null}
                </form>
              ) : (
                <p className="mt-4 text-gray-600">
                  Iniciá sesión como cliente para puntuar, comentar o denunciar.
                </p>
              )}

              <div className="mt-8 space-y-4">
                {data.reviews?.map((review) => (
                  <article key={review.id} className="border rounded-lg p-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-semibold">@{review.username}</p>
                      <Stars value={review.rating} />
                    </div>
                    {review.comment ? (
                      <p className="mt-3 whitespace-pre-wrap text-gray-700">
                        {review.comment}
                      </p>
                    ) : null}
                  </article>
                ))}

                {!data.reviews?.length ? (
                  <p className="text-gray-600">
                    Este producto todavía no tiene reseñas.
                  </p>
                ) : null}
              </div>
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
