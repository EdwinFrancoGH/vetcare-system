"use client";

import { useEffect, useState } from "react";
import { obtenerHistorialCitas } from "../../services/citas.service";
import { obtenerMascotas } from "../../services/mascotas.service";
import {
    formatearFechaLarga,
    ETIQUETA_ESTADO_CITA,
    COLOR_ESTADO_CITA,
    FILTROS_HISTORIAL_CITAS,
} from "../../utils/citas";

// Vista Médico: historial de citas ya resueltas o vencidas — perdidas
// (se quedaron reservadas y nunca se confirmaron ni cancelaron),
// confirmadas/completadas (se asume que se atendieron) y canceladas.
// `refrescar` es una prop que cambia cada vez que una acción en
// ProximasConsultas (confirmar/cancelar/completar) puede haber movido
// una cita hacia el historial, para volver a cargar la lista.
export default function HistorialCitas({ veterinario, refrescar }) {

    const [filtro, setFiltro] = useState("");
    const [citas, setCitas] = useState([]);
    const [mascotas, setMascotas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarDatos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [veterinario, filtro, refrescar]);

    async function cargarDatos() {

        try {

            setCargando(true);
            setError(null);

            const [respHistorial, respMascotas] = await Promise.all([
                obtenerHistorialCitas({ veterinario, estado: filtro }),
                obtenerMascotas(),
            ]);

            setCitas(respHistorial.data.data);
            setMascotas(respMascotas.data.data);

        } catch (error) {

            console.error("Error al cargar el historial de citas:", error);
            setError(
                error.response?.data?.message ||
                "No se pudo conectar con el servidor. Verifica que el backend esté corriendo."
            );
            setCitas([]);

        } finally {

            setCargando(false);

        }

    }

    function nombreMascota(mascotaId) {
        const mascota = mascotas.find((m) => m.id === mascotaId);
        return mascota ? mascota.nombre : "—";
    }

    return (
        <div className="mt-8">

            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">

                <h2 className="text-2xl font-bold text-gray-900">
                    Historial de Citas
                </h2>

                <div className="flex flex-wrap gap-2">
                    {FILTROS_HISTORIAL_CITAS.map((opcion) => (
                        <button
                            key={opcion.valor || "todas"}
                            onClick={() => setFiltro(opcion.valor)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium border ${
                                filtro === opcion.valor
                                    ? "bg-blue-700 text-white border-blue-700"
                                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
                            }`}
                        >
                            {opcion.etiqueta}
                        </button>
                    ))}
                </div>

            </div>

            {error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">
                    {error}
                </div>
            ) : cargando ? (
                <p className="text-gray-500">Cargando historial...</p>
            ) : citas.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-6 text-gray-500">
                    No hay citas en el historial con este filtro.
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="min-w-full">
                        <thead className="bg-blue-900 text-white">
                            <tr>
                                <th className="p-4 text-left">Fecha</th>
                                <th className="p-4 text-left">Hora</th>
                                <th className="p-4 text-left">Mascota</th>
                                <th className="p-4 text-left">Motivo</th>
                                <th className="p-4 text-left">Veterinario</th>
                                <th className="p-4 text-left">Estado</th>
                            </tr>
                        </thead>

                        <tbody>
                            {citas.map((cita) => (
                                <tr key={cita.id} className="border-b hover:bg-gray-50 text-gray-900">

                                    <td className="p-4">{formatearFechaLarga(cita.fecha)}</td>

                                    <td className="p-4">{cita.hora}</td>

                                    <td className="p-4">{nombreMascota(cita.mascotaId)}</td>

                                    <td className="p-4">{cita.motivo}</td>

                                    <td className="p-4">{cita.veterinario}</td>

                                    <td className="p-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${COLOR_ESTADO_CITA[cita.estadoHistorial] || "bg-gray-100 text-gray-700"}`}
                                        >
                                            {ETIQUETA_ESTADO_CITA[cita.estadoHistorial] || cita.estadoHistorial}
                                        </span>
                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    );

}
