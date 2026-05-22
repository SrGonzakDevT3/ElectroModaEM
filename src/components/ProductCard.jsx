import Image from "next/image";

export default function ProductCard({ nombre, precio, imagen }) {
  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="w-full h-64 relative">
        <Image src={imagen} alt={nombre} fill style={{ objectFit: "cover" }} />
      </div>

      <div className="p-4">
        <h4 className="font-semibold">{nombre}</h4>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-lg font-bold">${precio}</div>
          <button className="bg-black text-white px-3 py-1 rounded">Agregar</button>
        </div>
      </div>
    </article>
  );
}
