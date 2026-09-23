"use client";

import { useEffect, useState } from "react";

export default function AgendaPage() {
  const [fecha, setFecha] = useState("2026-09-14");
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const obtenerAgenda = async () => {
    try {
      setCargando(true);
      setError("");

      const respuesta = await fetch(
        `http://localhost:5000/api/citas/agenda?fecha=${fecha}`
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok || !resultado.ok) {
        throw new Error("No se pudo obtener la agenda");
      }

      setCitas(resultado.data);
    } catch (error) {
      setError("No fue posible conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerAgenda();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Agenda de Citas
          </h1>

          <p className="text-gray-600 mt-2">
            Consulta las citas programadas para una fecha determinada.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha
              </label>

              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>

            <button
              onClick={obtenerAgenda}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
            >
              Consultar agenda
            </button>

          </div>
        </div>

        {cargando && (
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <p className="text-gray-600">
              Cargando citas...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        {!cargando && !error && (
          <div className="bg-white rounded-xl shadow overflow-hidden">

            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                Citas del {fecha}
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                {citas.length} cita(s) encontrada(s)
              </p>
            </div>

            {citas.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No hay citas programadas para esta fecha.
              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">
                        Hora
                      </th>

                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">
                        Veterinario
                      </th>

                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">
                        Propietario
                      </th>

                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">
                        Mascota
                      </th>

                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">
                        Motivo
                      </th>

                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-700">
                        Estado
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {citas.map((cita) => (
                      <tr
                        key={cita.id}
                        className="border-t hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 font-medium text-gray-800">
                          {cita.hora}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {cita.veterinario}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {cita.propietario}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {cita.mascotaId}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {cita.motivo}
                        </td>

                        <td className="px-6 py-4">
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                            {cita.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              </div>
            )}

          </div>
        )}

      </div>
    </main>
  );
}