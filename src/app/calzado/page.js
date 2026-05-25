import Image from "next/image";
import Navbar from "../../components/Navbar";
import ProductCard from "../../components/ProductCard";

export default function Calzado() {
  const productos = [
    { nombre: "Zapatillas Topper", precio: 67.125, imagen: "/colecciones/calzados/Topper.jpg" },
    { nombre: "Adidas SportPremiun", precio: 88.256, imagen: "/colecciones/calzados/Adidas.jpg" },
    { nombre: "Nike edicion limitada", precio: 135.723, imagen: "/colecciones/calzados/Nike.jpg" }
  ];

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <section className="relative bg-black text-white">
        <div className="absolute inset-0">
          <Image
            src="/colecciones/calzado.jpg"
            alt="Colección Calzado"
            fill
            style={{ objectFit: "center", opacity: 0.45 }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-32">
          <h1 className="text-5xl font-extrabold">Calzado</h1>
          <p className="mt-4 text-gray-200 max-w-xl">
            Rendimiento, confort y diseño para cada paso.
          </p>
        </div>
      </section>

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
