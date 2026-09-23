"use client";

import { useState } from "react";

export default function DiagnosticosPage() {
  const [formulario, setFormulario] = useState({
    consultaId: "",
    mascotaId: "",
    veterinarioId: "",
    fecha: "",
    descripcion: "",
  });

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    setFormulario({
      ...formulario,
      [name]: value,
    });
  };

  const crearDiagnostico = async (e) => {
    e.preventDefault();

    setMensaje("");
    setError("");
    setGuardando(true);

    try {
      const respuesta = await fetch(
        "http://localhost:5000/api/diagnosticos",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formulario),
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok || !resultado.ok) {
        throw new Error(
          resultado.error || "No fue posible registrar el diagnóstico."
        );
      }

      setMensaje("Diagnóstico registrado correctamente.");

      setFormulario({
        consultaId: "",
        mascotaId: "",
        veterinarioId: "",
        fecha: "",
        descripcion: "",
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Diagnóstico Veterinario
          </h1>

          <p className="text-gray-600 mt-2">
            Registra el diagnóstico asociado a una consulta médica.
          </p>
        </div>

        <form
          onSubmit={crearDiagnostico}
          className="bg-white rounded-xl shadow p-6"
        >

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID de la consulta
              </label>

              <input
                type="text"
                name="consultaId"
                value={formulario.consultaId}
                onChange={manejarCambio}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Ej. consulta-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID de la mascota
              </label>

              <input
                type="text"
                name="mascotaId"
                value={formulario.mascotaId}
                onChange={manejarCambio}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Ej. mascota-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID del veterinario
              </label>

              <input
                type="text"
                name="veterinarioId"
                value={formulario.veterinarioId}
                onChange={manejarCambio}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Ej. veterinario-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha
              </label>

              <input
                type="date"
                name="fecha"
                value={formulario.fecha}
                onChange={manejarCambio}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diagnóstico
              </label>

              <textarea
                name="descripcion"
                value={formulario.descripcion}
                onChange={manejarCambio}
                required
                rows="5"
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                placeholder="Describe el diagnóstico realizado a la mascota"
              />
            </div>

          </div>

          {mensaje && (
            <div className="mt-6 bg-green-100 border border-green-300 text-green-700 rounded-lg p-4">
              {mensaje}
            </div>
          )}

          {error && (
            <div className="mt-6 bg-red-100 border border-red-300 text-red-700 rounded-lg p-4">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={guardando}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {guardando ? "Guardando..." : "Registrar diagnóstico"}
            </button>
          </div>

        </form>

      </div>
    </main>
  );
}