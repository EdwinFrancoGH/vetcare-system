"use client";

import { formatearFechaLarga, COLOR_ESTADO_CITA, ETIQUETA_ESTADO_CITA } from "../../../utils/citas";

export default function TablaCitasAnteriores({
    anteriores = [],
    filtroMascota = "",
    mostrarTodasAnteriores = false,
    setMostrarTodasAnteriores,
    nombreMascota,
}) {
    const anterioresFiltradas = filtroMascota
        ? anteriores.filter((c) => c.mascotaId === filtroMascota)
        : anteriores;

    const anterioresVisibles = mostrarTodasAnteriores
        ? anterioresFiltradas
        : anterioresFiltradas.slice(0, 10);

    return (
        <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="px-5 py-4 border-b font-semibold text-gray-800 flex justify-between items-center">
                <span>Citas anteriores</span>
                {anterioresFiltradas.length > 0 && (
                    <span className="text-xs text-gray-500 font-normal">
                        {anterioresFiltradas.length} {anterioresFiltradas.length === 1 ? "cita" : "citas"}
                    </span>
                )}
            </div>

            {anterioresFiltradas.length === 0 ? (
                <p className="p-5 text-gray-500">
                    Aún no tienes citas anteriores.
                </p>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-blue-900 text-white">
                                <tr>
                                    <th className="p-3 text-left">Fecha</th>
                                    <th className="p-3 text-left">Hora</th>
                                    <th className="p-3 text-left">Mascota</th>
                                    <th className="p-3 text-left">Veterinario</th>
                                    <th className="p-3 text-left">Motivo</th>
                                    <th className="p-3 text-left">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {anterioresVisibles.map((c) => {
                                    const esPasadaActiva = ["reservada", "confirmada"].includes(c.estado);
                                    const estadoVisual = esPasadaActiva ? "perdida" : c.estado;

                                    return (
                                        <tr key={c.id} className="border-b text-gray-900 hover:bg-gray-50">
                                            <td className="p-3 capitalize">{formatearFechaLarga(c.fecha)}</td>
                                            <td className="p-3">{c.hora}</td>
                                            <td className="p-3 font-medium">{nombreMascota(c.mascotaId)}</td>
                                            <td className="p-3">{c.veterinario}</td>
                                            <td className="p-3">{c.motivo || "—"}</td>
                                            <td className="p-3">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        COLOR_ESTADO_CITA[estadoVisual] || "bg-gray-100 text-gray-700"
                                                    }`}
                                                >
                                                    {ETIQUETA_ESTADO_CITA[estadoVisual] || estadoVisual}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {anterioresFiltradas.length > 10 && (
                        <div className="p-4 border-t text-center bg-gray-50">
                            <button
                                type="button"
                                onClick={() => setMostrarTodasAnteriores((prev) => !prev)}
                                className="text-sm font-semibold text-blue-700 hover:text-blue-900 transition"
                            >
                                {mostrarTodasAnteriores
                                    ? "Ver menos"
                                    : `Ver todas (${anterioresFiltradas.length} citas)`}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
