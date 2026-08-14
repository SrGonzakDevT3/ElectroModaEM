import Image from "next/image";
import Link from "next/link";
import Navbar from "../../../components/Navbar";

export default function Faqs() {
  const faqs = [
    { q: "¿Cuál es la dirección y horarios de la empresa?", a: "Nuestra oficina central y punto de retiro se encuentra en la dirección indicada en Contacto. Horarios de atención: lunes a viernes 9–18 hs, los fines de semana y feriados atendemos de 8-16hs." },
    { q: "¿Qué medios de pago aceptan?", a: "Aceptamos tarjetas de crédito y débito, transferencias y pagos en cuotas según promociones vigentes." },
    { q: "¿Puedo cambiar la ubicación de mis envios?", a: "Depende de la disponibilidad y la política del repartidor. Contactanos con el número de pedido y te asesoramos." },
    { q: "¿Los menores pueden recibir los envios?", a: "La política de menores varía por envio o distribuidor; revisá la ficha en la publicacion o e-ticket o consultanos." },
    { q: "¿Qué pasa si mi venta está sujeta a reprogramación?", a: "En caso de reprogramación, te informamos por mail y ofrecemos opciones de reembolso o cambio de fecha según la política del publicante del producto." },
    { q: "¿Cómo puedo realizar la devolución de mis compras?", a: "Seguí el proceso de devoluciones en la sección de ayuda o contactanos para iniciar la gestión." },
    { q: "¿Cómo corroborar que una publicacion no es falsa?", a: "Verificá el e‑ticket con el código QR y comprá solo en perfiles oficiales o recomendados." },
    { q: "¿Cómo obtengo mi e-ticket?", a: "El e‑ticket se envía por mail y también está disponible en tu cuenta en la sección 'Mis pedidos'." }
  ];

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <section className="relative bg-black text-white">
        <div className="absolute inset-0">
          <Image
            src="/hero.jpg"
            alt="Preguntas frecuentes ElectroModa"
            fill
            sizes="100vw"
            style={{ objectFit: "cover", opacity: 0.45 }}
            priority
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-28 text-center">
          <h1 className="text-4xl font-extrabold">Preguntas frecuentes</h1>
          <p className="mt-4 text-gray-200">Respuestas claras y directas a las dudas más comunes.</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-16 space-y-4">
        {faqs.map((f, i) => (
          <details key={i} className="bg-gray-50 p-4 rounded-lg border">
            <summary className="font-semibold cursor-pointer">{i + 1}. {f.q}</summary>
            <div className="mt-3 text-gray-700">{f.a}</div>
          </details>
        ))}

        <div className="mt-6 text-sm text-gray-600">
          <p>Si no encontrás la respuesta, escribinos desde la página de soporte.</p>
          <Link href="/mas-info/soporte" className="text-black font-semibold">Ir a Soporte →</Link>
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
