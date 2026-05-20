export default function ProductCard({ nombre, precio, imagen }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <img
        src={imagen}
        alt={nombre}
        className="w-full h-64 object-cover rounded-lg"
      />

      <h2 className="text-xl font-semibold mt-3">
        {nombre}
      </h2>

      <p className="text-green-600 font-bold">
        ${precio}
      </p>

      <button className="bg-black text-white px-4 py-2 rounded mt-3 w-full">
        Comprar
      </button>
    </div>
  );
}