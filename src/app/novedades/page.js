import Image from "next/image";
import Navbar from "../../components/Navbar";
import ProductCard from "../../components/ProductCard";

export default function Novedades() {
  const productos = [
    { nombre: "vestido blanco", precio: 45.978, imagen: "/colecciones/mujer/vestido-blanco.jpg" },
    { nombre: "Combo 2x1 (musculosa + short)", precio: 10.234, imagen: "/colecciones/hombre/musculosa-combo.jpg" },
    { nombre: "mochila deportiva (unisex)", precio: 80.895, imagen: "/colecciones/accesorios/mochila-deportiva.jpg" },
    { nombre: "Nike edicion limitada", precio: 135.723, imagen: "/colecciones/calzados/Nike.jpg" }
  ];

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />

      {/* HERO */}
      <section className="relative bg-black text-white">
        <div className="absolute inset-0">
          <Image
            src="/hero.jpg"
            alt="Novedades ElectroModa"
            fill
            sizes="100vw"
            style={{ objectFit: "center", opacity: 0.45 }}
            priority
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-28">
          <h1 className="text-5xl font-extrabold">Novedades</h1>
          <p className="mt-4 text-gray-200 max-w-xl">Lo último en diseño y tecnología deportiva. Descubrí lo nuevo.</p>
          <div className="mt-6">
            <a href="#nuevos" className="bg-yellow-400 text-black px-6 py-3 rounded-md font-semibold">VER NOVEDADES →</a>
          </div>
        </div>
      </section>

      {/* NUEVOS PRODUCTOS */}
      <section id="nuevos" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-6">Nuevos lanzamientos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {productos.map((p, i) => (
            <ProductCard key={i} nombre={p.nombre} precio={p.precio} imagen={p.imagen} />
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="text-white font-bold text-xl">electromoda</div>
          <p className="mt-2">Moda deportiva con energía y actitud.</p>
        </div>
      </footer>
    </main>
  );
}
