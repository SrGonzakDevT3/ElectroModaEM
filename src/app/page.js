// Componente optimizado de Next.js para carga de imágenes de la pagina (lazy loading, compresión, etc.)
import Image from "next/image";
import Navbar from "../components/Navbar";
import ProductCard from "../components/ProductCard";

export default function Home() {
  // Arreglo de objetos que actúa como una base de datos local (o mock). 
  // Contiene la información esencial para mapear y renderizar los productos.
  const productos = [
    { nombre: "Campera Cyberpunk", precio: "35.000", imagen: "/img/campera.jfif" },
    { nombre: "Remera Neon", precio: "20.000", imagen: "/img/remera.jfif" },
    { nombre: "Zapatillas Tech", precio: "75.000", imagen: "/img/zapas.jfif" }
  ];

  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Componente de navegación principal */}
      <Navbar />

      {/* HERO: Sección de introducción destacada. Ocupa gran parte de la pantalla. */}
      <section className="relative bg-black text-white">
        {/* Contenedor absoluto para la imagen de fondo del Hero */}
        <div className="absolute inset-0">
          <Image
            src="/hero.jpg"
            alt="Hero ElectroModa"
            fill // Hace que la imagen llene su contenedor padre
            sizes="100vw"
            style={{ objectFit: "center", opacity: 0.45 }}
            priority // Indica a Next.js que cargue esta imagen primero por ser contenido crítico (LCP)
          />
        </div>

        {/* Contenedor del contenido del Hero superpuesto a la imagen (z-10) */}
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-28 flex flex-col md:flex-row items-center gap-8">
          <div className="w-full md:w-1/2">
            <h2 className="text-sm tracking-widest text-yellow-300 font-semibold">NUEVA COLECCIÓN</h2>
            <h1 className="mt-4 text-4xl md:text-6xl font-extrabold leading-tight">
              ACTIVA TU MEJOR VERSIÓN
            </h1>
            <p className="mt-4 text-gray-200 max-w-xl">
              Ropa deportiva diseñada para rendir al máximo dentro y fuera del entrenamiento.
            </p>

            {/* Botones de Call to Action (Llamado a la acción) */}
            <div className="mt-6 flex gap-4">
              <a href="#colecciones" className="bg-yellow-400 text-black px-6 py-3 rounded-md font-semibold hover:opacity-95">
                COMPRAR AHORA →
              </a>
              <a href="/mas-info" className="border border-white px-6 py-3 rounded-md text-white hover:bg-white/10">
                MÁS INFO
              </a>
            </div>

            {/* Grid de beneficios de la tienda (Envío, Cambios, etc.) */}
            <div className="mt-8 grid grid-cols-2 gap-4 text-sm text-gray-200">
              <div className="flex items-center gap-3">
                <span className="bg-white/10 p-3 rounded-full">🚚</span>
                <div>
                  <div className="font-semibold">ENVÍO GRATIS</div>
                  <div className="text-xs">en compras superiores a $15.000</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="bg-white/10 p-3 rounded-full">🔁</span>
                <div>
                  <div className="font-semibold">CAMBIOS FÁCILES</div>
                  <div className="text-xs">30 días para cambios</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="bg-white/10 p-3 rounded-full">🔒</span>
                <div>
                  <div className="font-semibold">PAGOS SEGUROS</div>
                  <div className="text-xs">Compra 100% protegida</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="bg-white/10 p-3 rounded-full">⏰</span>
                <div>
                  <div className="font-semibold">ATENCIÓN 24/7</div>
                  <div className="text-xs">Estamos para ayudarte</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COLECCIONES DESTACADAS: Grid responsivo de categorías de la tienda */}
      <section id="colecciones" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center">
          <h3 className="text-3xl font-bold">COLECCIONES DESTACADAS</h3>
          <p className="text-gray-600 mt-2">ELIGE TU ESTILO</p>
        </div>

        {/* Contenedor grid que pasa de 1 columna en móvil a 2 en tablet y 4 en escritorio */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Tarjeta de categoría interactiva */}
          <a className="group relative overflow-hidden rounded-lg" href="/hombre">
            <Image src="/colecciones/hombre.jpg" alt="Hombre" width={600} height={400} className="group-hover:scale-105 transition-transform" />
            <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-6">
              <div className="text-white font-bold text-lg">HOMBRE</div>
              <div className="text-sm text-gray-200">Entrena sin límites — VER COLECCIÓN</div>
            </div>
          </a>

          <a className="group relative overflow-hidden rounded-lg" href="/mujer">
            <Image src="/colecciones/mujer.jpg" alt="Mujer" width={600} height={400} className="group-hover:scale-105 transition-transform" />
            <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-6">
              <div className="text-white font-bold text-lg">MUJER</div>
              <div className="text-sm text-gray-200">Fuerza y estilo — VER COLECCIÓN</div>
            </div>
          </a>

          <a className="group relative overflow-hidden rounded-lg" href="/calzado">
            <Image src="/colecciones/calzado.jpg" alt="Calzado" width={600} height={400} className="group-hover:scale-105 transition-transform" />
            <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-6">
              <div className="text-white font-bold text-lg">CALZADO</div>
              <div className="text-sm text-gray-200">Rendimiento y confort — VER COLECCIÓN</div>
            </div>
          </a>

          <a className="group relative overflow-hidden rounded-lg" href="/accesorios">
            <Image src="/colecciones/accesorios.jpg" alt="Accesorios" width={600} height={400} className="group-hover:scale-105 transition-transform" />
            <div className="absolute inset-0 bg-black/30 flex flex-col justify-end p-6">
              <div className="text-white font-bold text-lg">ACCESORIOS</div>
              <div className="text-sm text-gray-200">Lleva tu estilo — VER COLECCIÓN</div>
            </div>
          </a>
        </div>
      </section>

      {/* PRODUCTOS: Sección dinámica donde se listan los productos individuales */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h3 className="text-2xl font-bold mb-6">Productos destacados</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Método map que recorre el array de productos y renderiza un componente ProductCard por cada uno */}
          {productos.map((p, i) => (
            <ProductCard key={i} nombre={p.nombre} precio={p.precio} imagen={p.imagen} />
          ))}
        </div>
      </section>

      {/* FOOTER: Pie de página de la aplicación */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="text-white font-bold text-xl">electromoda</div>
          <p className="mt-2">electromoda es más que ropa deportiva, es energía, es actitud, es tu mejor versión.</p>
        </div>
      </footer>
    </main>
  );
}
