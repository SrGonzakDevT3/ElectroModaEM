// Componente Link de Next.js para una navegación rápida del lado del cliente (sin recargar la página entera)
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="bg-black text-white">
      {/* Contenedor que alinea los elementos (Logo, Menú, Iconos) horizontalmente y con espaciado */}
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Bloque del logo y título de la marca */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12">
            <Image src="/logo-blanco.png" alt="logo" width={48} height={48} style={{ objectFit: "contain" }} />
          </div>
          <Link href="/" className="text-xl font-bold">electromoda</Link>
        </div>

        {/* Menú de enlaces principales: Se oculta en dispositivos móviles (hidden) y se muestra en escritorio (md:flex) */}
        <ul className="hidden md:flex items-center gap-6 text-sm uppercase">
          <li><Link href="/">INICIO</Link></li>
          <li><Link href="/mujer">MUJER</Link></li>
          <li><Link href="/hombre">HOMBRE</Link></li>
          <li><Link href="/accesorios">ACCESORIOS</Link></li>
          <li><Link href="/novedades">NOVEDADES</Link></li>
          {/* Enlace destacado en amarillo */}
          <li><Link href="/ofertas" className="text-yellow-300">OFERTAS</Link></li>
        </ul>

        {/* Contenedor de iconos de la derecha (Carrito de compras y Menú hamburguesa para móviles) */}
        <div className="flex items-center gap-4">
          <Link href="/cart" className="hidden md:inline-block">🛒</Link>
          <button className="md:hidden">☰</button>
        </div>
      </div>
    </nav>
  );
}