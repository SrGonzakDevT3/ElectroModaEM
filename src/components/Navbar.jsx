export default function Navbar() {
  return (
    <nav className="bg-black text-white p-4 flex justify-between">

      <h1 className="text-2xl font-bold">
        ElectroModa
      </h1>

      <ul className="flex gap-6">
        <li>Inicio</li>
        <li>Hombre</li>
        <li>Mujer</li>
        <li>Ofertas</li>
      </ul>

    </nav>
  );
}