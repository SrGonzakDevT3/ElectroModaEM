"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (active) setUser(data.user || null);
      })
      .catch(() => {
        if (active) setUser(null);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <nav className="bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12">
            <Image
              src="/logo-blanco.png"
              alt="ElectroModa"
              width={48}
              height={48}
              style={{ objectFit: "contain" }}
            />
          </div>

          <Link href="/" className="text-xl font-bold">
            electromoda
          </Link>
        </div>

        <ul className="hidden md:flex items-center gap-6 text-sm uppercase">
          <li><Link href="/">INICIO</Link></li>
          <li><Link href="/mujer">MUJER</Link></li>
          <li><Link href="/hombre">HOMBRE</Link></li>
          <li><Link href="/accesorios">ACCESORIOS</Link></li>
          <li><Link href="/novedades">NOVEDADES</Link></li>
          <li>
            <Link href="/ofertas" className="text-yellow-300">
              OFERTAS
            </Link>
          </li>
        </ul>

        <div className="flex items-center gap-4">
          <Link
            href="/cart"
            className="hidden md:inline-block"
            aria-label="Carrito"
          >
            🛒
          </Link>

          <Link
            href={user ? "/perfil" : "/login"}
            className="text-sm font-semibold"
            aria-label={user ? "Mi perfil" : "Ingresar"}
          >
            {user ? "MI PERFIL" : "INGRESAR"}
          </Link>

          <button className="md:hidden" aria-label="Abrir menú">
            ☰
          </button>
        </div>
      </div>
    </nav>
  );
}
