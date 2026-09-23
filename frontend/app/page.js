export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-xl w-full">
        <h1 className="text-4xl font-bold text-blue-700 mb-4">
          VetCare
        </h1>

        <p className="text-gray-600 text-lg mb-6">
          Sistema de gestión para el Centro Veterinario La Mascota
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="border rounded-xl p-4">
            <h2 className="font-semibold text-gray-800">
              Gestión de Citas
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Administración y disponibilidad de citas veterinarias.
            </p>
          </div>

          <div className="border rounded-xl p-4">
            <h2 className="font-semibold text-gray-800">
              Atención Médica
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Registro y seguimiento de consultas veterinarias.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}