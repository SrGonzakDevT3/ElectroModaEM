import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";

export default function Home() {

  const productos = [
    {
      nombre: "Campera Cyberpunk",
      precio: 120,
      imagen: "/img/campera.jfif"
    },
    {
      nombre: "Remera Neon",
      precio: 60,
      imagen: "/img/remera.jfif"
    },
    {
      nombre: "Zapatillas Tech",
      precio: 200,
      imagen: "/img/zapas.jfif"
    }
  ];

  return (
    <main className="min-h-screen bg-gray-100">

      <Navbar />

      <section className="text-center mt-10">
        <h1 className="text-5xl font-bold">
          ElectroModa
        </h1>

        <p className="text-gray-600 mt-3">
          Moda futurista para todos
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 p-10">

        {productos.map((producto, index) => (
          <ProductCard
            key={index}
            nombre={producto.nombre}
            precio={producto.precio}
            imagen={producto.imagen}
          />
        ))}

      </section>

    </main>
  );
}