import Image from "next/image";
import Link from "next/link";
import Navbar from "../../components/Navbar";

export default function MasInfo() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <Navbar />

      {/* HERO */}
      <section className="relative bg-black text-white">
        <div className="absolute inset-0">
          <Image
            src="/hero.jpg"
            alt="Más información ElectroModa"
            fill
            sizes="100vw"
            style={{ objectFit: "cover", opacity: 0.45 }}
            priority
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-28">
          <h1 className="text-5xl font-extrabold">Más información</h1>
          <p className="mt-4 text-gray-200 max-w-xl">
            Todo lo que necesitás saber sobre envíos, devoluciones, talles y materiales. Información detallada para que compres con tranquilidad.
          </p>
        </div>
      </section>

      {/* CONTENIDO INFORMATIVO */}
      <section className="max-w-6xl mx-auto px-6 py-16 space-y-12">
        <article>
          <h2 className="text-2xl font-bold mb-4">Envíos y devoluciones</h2>

          <div className="prose max-w-none text-gray-700">
            <p>
              **Diario de envíos** — Te contamos cómo trabajamos, paso a paso. Cada pedido que recibimos pasa por un proceso pensado para minimizar errores y acelerar la entrega. Primero verificamos stock y calidad; luego empaquetamos con materiales que protegen la prenda durante el transporte; finalmente, generamos la etiqueta y entregamos el paquete al transportista. Si tu pedido sale el mismo día, te lo notificamos por e‑mail y por SMS con el número de seguimiento.
            </p>

            <p>
              **Tiempos estimados** — Trabajamos con varias empresas de logística para cubrir todo el país. En zonas urbanas grandes, los envíos suelen demorar entre 24 y 72 horas; en zonas suburbanas o rurales, entre 3 y 7 días hábiles. En temporadas de alta demanda (lanzamientos, promociones) los tiempos pueden extenderse; siempre te avisamos si hay demoras.
            </p>

            <p>
              **Costos y promociones** — Ofrecemos envío gratuito en compras superiores al monto indicado en la web. Para pedidos por debajo de ese umbral, el costo se calcula según peso y destino y se muestra antes de confirmar la compra. En campañas especiales, activamos envíos promocionales o descuentos en la tarifa.
            </p>

            <p>
              **Seguimiento y comunicación** — Desde que despachamos, podés seguir tu paquete con el número de tracking. Si detectás una demora, nuestro equipo de soporte revisa el estado y coordina con la empresa de transporte. Si el paquete aparece como entregado y no lo recibiste, iniciamos una investigación con la logística y te mantenemos informado hasta resolverlo.
            </p>

            <p>
              **Devoluciones y cambios paso a paso** — Queremos que quedes conforme. Si necesitás cambiar talle o devolver, seguí estos pasos: 1) Iniciá la solicitud desde tu cuenta o escribinos al soporte; 2) Empaquetá el producto en su estado original, con etiquetas y sin uso; 3) Coordinamos la recolección o te indicamos el punto de entrega; 4) Al recibir y verificar el producto, procesamos el cambio o la devolución en el mismo método de pago o mediante crédito en tienda. El proceso suele tardar entre 3 y 10 días hábiles según la logística.
            </p>

            <p>
              **Casos especiales** — Si el producto llega dañado o con defecto de fábrica, priorizamos la resolución: reemplazo inmediato o devolución con reembolso completo. Para productos en oferta, las condiciones de cambio pueden variar; siempre lo especificamos en la ficha del producto.
            </p>

            <p>
              **Consejos prácticos** — Conservá el embalaje y la etiqueta hasta confirmar que el producto te queda bien. Sacá fotos si hay un defecto y adjuntalas en la solicitud de devolución; eso acelera la gestión. Si necesitás asesoramiento sobre talles antes de comprar, nuestro equipo te puede orientar por chat o mail.
            </p>
          </div>
        </article>

        <article>
          <h2 className="text-2xl font-bold mb-4">Talles y materiales</h2>

          <div className="prose max-w-none text-gray-700">
            <p>
              **Diario de materiales** — En Electromoda trabajamos con tejidos técnicos pensados para rendimiento. Cada prenda pasa por pruebas de resistencia, transpirabilidad y confort. Los materiales más usados son poliéster de alta tenacidad con tratamientos anti‑humedad, mallas de ventilación estratégicamente ubicadas y mezclas con elastano para movilidad. Contamos con proveedores certificados y realizamos controles de calidad periódicos.
            </p>

            <p>
              **Guía de talles** — Sabemos que elegir talle online puede ser un desafío. Por eso en cada ficha de producto incluimos una guía detallada con medidas en centímetros (pecho, cintura, cadera, largo) y una recomendación de ajuste (ajustado, estándar, holgado). Además, indicamos la altura y talle del modelo de la foto para que tengas un punto de referencia real.
            </p>

            <p>
              **Cómo medir correctamente** — Para obtener medidas precisas: usá una cinta métrica flexible; medí el pecho en la parte más ancha, la cintura en la parte más estrecha y la cadera en la parte más ancha. Si estás entre dos talles, recomendamos elegir el mayor para mayor comodidad o consultar la guía de ajuste del producto.
            </p>

            <p>
              **Cuidado y mantenimiento** — Para prolongar la vida útil: lavá las prendas técnicas a baja temperatura, evitá suavizantes que obstruyan la transpiración y secá al aire cuando sea posible. Las zapatillas se limpian con un paño húmedo y cepillo suave; para manchas difíciles, seguí las instrucciones del fabricante.
            </p>

            <p>
              **Sostenibilidad** — Estamos incorporando materiales reciclados y procesos de producción más eficientes. En las fichas indicamos el porcentaje de materiales reciclados cuando aplica y trabajamos con proveedores que reducen el desperdicio.
            </p>

            <p>
              **Garantía y pruebas** — Cada producto cuenta con garantía por defectos de fabricación. Si detectás un problema, seguí el proceso de devolución y lo evaluamos. Para colecciones técnicas, realizamos tests de uso y recopilamos feedback de atletas y usuarios para mejorar iterativamente.
            </p>

            <p>
              **Recomendación final** — Si tenés dudas sobre talles o materiales antes de comprar, consultanos: te damos una recomendación personalizada basada en tu uso (running, gimnasio, lifestyle) y en tus medidas. Esto reduce devoluciones y mejora la experiencia de compra.
            </p>
          </div>
        </article>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg border">
            <h3 className="font-bold mb-3">Soporte y contacto</h3>
            <p className="text-gray-700 mb-4">Si necesitás ayuda personalizada, tenemos un equipo listo para asistirte. Para ver todas las opciones de contacto y horarios, entrá a la página dedicada.</p>
            <Link href="/mas-info/soporte" className="inline-block bg-black text-white px-5 py-2 rounded font-semibold">Ir a Soporte →</Link>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border">
            <h3 className="font-bold mb-3">Preguntas frecuentes</h3>
            <p className="text-gray-700 mb-4">Respondemos las dudas más comunes en formato pregunta-respuesta. Si no encontrás lo que buscás, podés enviar tu consulta desde la página de FAQs.</p>
            <Link href="/mas-info/faqs" className="inline-block bg-black text-white px-5 py-2 rounded font-semibold">Ir a Preguntas Frecuentes →</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="text-white font-bold text-xl">electromoda</div>
          <p className="mt-2">Moda deportiva con energía y actitud.</p>
        </div>
      </footer>
    </main>
  );
}
