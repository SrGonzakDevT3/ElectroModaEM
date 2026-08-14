import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { getSession } from "../../lib/auth";
import LogoutButton from "../../components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function Perfil() {
  const user = await getSession();

  if (!user) redirect("/login");

  const company = user.role === "company";
  const admin = user.role === "admin";

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <section className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-extrabold">Mi perfil</h1>

        <div className="mt-8 bg-gray-50 border rounded-lg p-6 space-y-3">
          <p>
            <strong>Perfil:</strong>{" "}
            {admin
              ? user.is_admin_owner
                ? "Administrador original"
                : "Co-administrador"
              : company
                ? "Empresa / Distribuidora"
                : "Cliente"}
          </p>

          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Usuario:</strong> @{user.username}</p>
          <p><strong>DNI:</strong> {user.dni}</p>
          <p><strong>Nombre:</strong> {user.first_name} {user.last_name}</p>
          <p><strong>Email:</strong> {user.email}</p>

          {company ? (
            <>
              <p><strong>Empresa / PyME:</strong> {user.business_name}</p>
              <p><strong>CUIT:</strong> {user.cuit}</p>
              <p>
                <strong>Condición fiscal:</strong>{" "}
                {user.tax_condition || "No informada"}
              </p>
            </>
          ) : null}

          {user.phone ? <p><strong>Teléfono:</strong> {user.phone}</p> : null}
          {user.address ? <p><strong>Dirección:</strong> {user.address}</p> : null}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/cart"
            className="bg-black text-white px-5 py-3 rounded font-semibold"
          >
            Ver carrito
          </Link>

          {company ? (
            <Link
              href="/empresa/productos"
              className="border px-5 py-3 rounded font-semibold"
            >
              Mis productos
            </Link>
          ) : null}

          <Link
            href="/mas-info/soporte"
            className="border px-5 py-3 rounded font-semibold"
          >
            Soporte
          </Link>

          <Link
            href="/perfil/soporte"
            className="border px-5 py-3 rounded font-semibold"
          >
            Mis consultas
          </Link>

          {admin ? (
            <Link
              href="/admin"
              className="border px-5 py-3 rounded font-semibold"
            >
              Panel admin
            </Link>
          ) : null}

          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
