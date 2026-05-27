import Image from "next/image";
import Link from "next/link";
import Navbar from "../../../components/Navbar";

export default function Soporte() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <section className="relative bg-black text-white">
        <div className="absolute inset-0">
          <Image
            src="/hero.jpg"
            alt="Soporte ElectroModa"
            fill
            sizes="100vw"
            style={{ objectFit: "cover", opacity: 0.45 }}
            priority
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-28 text-center">
          <h1 className="text-4xl font-extrabold">Soporte y contacto</h1>
          <p className="mt-4 text-gray-200">Estamos para ayudarte. Elegí el canal que prefieras y te respondemos rápido.</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-gray-50 rounded-lg border">
            <h2 className="font-bold mb-3">Chat en vivo</h2>
            <p className="text-gray-700 mb-2">Atención inmediata de lunes a viernes de 9 a 20 hs.</p>
            <p className="text-gray-700">Ideal para consultas rápidas sobre stock, talles y seguimiento de envíos.</p>
          </div>

          <div className="p-6 bg-gray-50 rounded-lg border">
            <h2 className="font-bold mb-3">Correo electrónico</h2>
            <p className="text-gray-700 mb-2">soporte@electromoda.com</p>
            <p className="text-gray-700">Respondemos en menos de 48 horas hábiles. Adjuntá fotos si tu consulta es por defecto o daño.</p>
          </div>

          <div className="p-6 bg-gray-50 rounded-lg border">
            <h2 className="font-bold mb-3">Teléfono</h2>
            <p className="text-gray-700 mb-2">0800‑ELECTRO (1234)</p>
            <p className="text-gray-700">Lunes a viernes 9–18 hs. Para seguimiento de pedidos y consultas urgentes.</p>
          </div>

          <div className="p-6 bg-gray-50 rounded-lg border">
            <h2 className="font-bold mb-3">Redes sociales</h2>
            <p className="text-gray-700 mb-2">Instagram, Facebook y X</p>
            <p className="text-gray-700">Atendemos mensajes directos y comentarios en horario comercial.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-bold mb-4">Formulario de contacto</h3>
          <p className="text-gray-700 mb-4">Si preferís, enviá tu consulta por este formulario y te respondemos por correo.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border p-3 rounded" placeholder="Nombre" />
            <input className="border p-3 rounded" placeholder="Email" />
            <input className="border p-3 rounded md:col-span-2" placeholder="Asunto" />
            <textarea className="border p-3 rounded md:col-span-2" rows="6" placeholder="Escribí tu consulta y adjuntá fotos si corresponde"></textarea>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <button className="bg-black text-white px-5 py-2 rounded font-semibold">Enviar consulta</button>
            <Link href="/mas-info" className="text-gray-600">Volver a Más información</Link>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="text-white font-bold text-xl">electromoda</div>
        </div>
      </footer>
    </main>
  );
}
