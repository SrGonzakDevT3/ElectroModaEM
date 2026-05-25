import Image from "next/image";
import Navbar from "../../components/Navbar";
import ProductCard from "../../components/ProductCard";

export default function Mujer() {
  const productos = [
    { nombre: "combo rojo", precio: 24.999, imagen: "/colecciones/mujer/combo-rojo.jpg" },
    { nombre: "vestido blanco", precio: 45.978, imagen: "/colecciones/mujer/vestido-blanco.jpg" },
    { nombre: "top negro", precio: 12.231, imagen: "/colecciones/mujer/top-negro.jpg" }
  ];

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />

      {/* HERO */}
      <section className="relative bg-black text-white">
        <div className="absolute inset-0">
          <Image
            src="/colecciones/mujer.jpg"
            alt="Colección Mujer"
            fill
            style={{ objectFit: "center", opacity: 0.45 }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-32">
          <h1 className="text-5xl font-extrabold">Colección Mujer</h1>
          <p className="mt-4 text-gray-200 max-w-xl">
            Fuerza, estilo y rendimiento para cada entrenamiento.
          </p>
        </div>
      </section>

      {/* PRODUCTOS */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold mb-6">Productos destacados</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {productos.map((p, i) => (
            <ProductCard key={i} nombre={p.nombre} precio={p.precio} imagen={p.imagen} />
          ))}
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-300 py-8 text-center">
        <div className="text-white font-bold text-xl">electromoda</div>
        <p className="mt-2">Moda deportiva con energía y actitud.</p>
      </footer>
    </main>
  );
}
