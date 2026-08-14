import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "../../components/Navbar";
import { getSession, isAdmin } from "../../lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSession();

  if (!isAdmin(user)) redirect("/admin/login");

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <section className="max-w-6xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-extrabold">Panel de administración</h1>

        <p className="mt-2 text-gray-600">
          {user.is_admin_owner
            ? "Administrador original"
            : "Co-administrador"}{" "}
          · {user.first_name}
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/usuarios"
            className="p-6 border rounded-lg bg-gray-50"
          >
            <h2 className="font-bold text-xl">Usuarios y roles</h2>
            <p className="mt-2 text-gray-600">
              Banear, eliminar y ascender clientes o distribuidoras.
            </p>
          </Link>

          <Link
            href="/admin/productos"
            className="p-6 border rounded-lg bg-gray-50"
          >
            <h2 className="font-bold text-xl">Productos de vendedores</h2>
            <p className="mt-2 text-gray-600">
              Monitorizar publicaciones, ocultarlas, revisarlas o aprobarlas.
            </p>
          </Link>

          <Link
            href="/admin/denuncias"
            className="p-6 border rounded-lg bg-gray-50"
          >
            <h2 className="font-bold text-xl">Denuncias</h2>
            <p className="mt-2 text-gray-600">
              Revisar productos denunciados por clientes.
            </p>
          </Link>

          <Link
            href="/admin/soporte"
            className="p-6 border rounded-lg bg-gray-50"
          >
            <h2 className="font-bold text-xl">Feed de soporte</h2>
            <p className="mt-2 text-gray-600">
              Ver, asignar y responder consultas de clientes y empresas.
            </p>
          </Link>
        </div>

        {user.is_admin_owner ? (
          <div className="mt-6 border rounded-lg p-5">
            <p className="font-semibold">Protección del administrador original</p>
            <p className="mt-1 text-sm text-gray-600">
              Los co-admins pueden moderar usuarios comunes, pero nunca pueden
              banear, eliminar o modificar al administrador original.
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
