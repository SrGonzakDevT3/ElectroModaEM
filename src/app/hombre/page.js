import Image from "next/image";
import Navbar from "../../components/Navbar";
import ProductCard from "../../components/ProductCard";
import { getProducts } from "../../lib/catalog";
import { getSession } from "../../lib/auth";

export const dynamic = "force-dynamic";

export default async function Hombre() {
  const user = await getSession();
  const distributorPrice = user?.role === "company";
  const productos = await getProducts("hombre");
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <section className="relative bg-black text-white">
        <div className="absolute inset-0"><Image src="/colecciones/hombre.jpg" alt="Colección Hombre" fill sizes="100vw" style={{ objectFit: "center", opacity: 0.45 }} /></div>
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-32"><h1 className="text-5xl font-extrabold">Colección Hombre</h1><p className="mt-4 text-gray-200 max-w-xl">Entrena sin límites con tecnología y estilo.</p></div>
      </section>
      <section className="max-w-6xl mx-auto px-6 py-16"><h2 className="text-3xl font-bold mb-6">Productos destacados</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-8">{productos.map((p) => <ProductCard key={p.id} id={p.id} nombre={p.name} precio={distributorPrice ? p.price_distributor : p.price_client} imagen={p.image_url} averageRating={p.average_rating} reviewCount={p.review_count} hasOptions={p.has_options} sellerName={p.seller_name} />)}</div></section>
      <footer className="bg-gray-900 text-gray-300 py-8 text-center"><div className="text-white font-bold text-xl">electromoda</div><p className="mt-2">Moda deportiva con energía y actitud.</p></footer>
    </main>
  );
}
