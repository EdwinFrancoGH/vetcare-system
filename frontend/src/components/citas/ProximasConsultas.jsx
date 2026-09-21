"use client";

import { useEffect, useState } from "react";
import {
    obtenerProximasConsultas,
    actualizarCita,
    cancelarCita,
} from "../../services/citas.service";
import { obtenerMascotas } from "../../services/mascotas.service";
import {
    formatearFechaLarga,
    ETIQUETA_ESTADO_CITA,
    COLOR_ESTADO_CITA,
} from "../../utils/citas";

// Vista Médico: lista de las próximas consultas ya reservadas o
// confirmadas, con acciones rápidas para confirmar, marcar como
// completada o cancelar. `onCambio` se llama después de cada acción para
// que HistorialCitas (que puede recibir esa cita una vez cancelada o
// completada) también se refresque.
export default function ProximasConsultas({ veterinario, onCambio }) {

    const [citas, setCitas] = useState([]);
    const [mascotas, setMascotas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        cargarDatos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [veterinario]);

    async function cargarDatos() {

        try {

            setError(null);

            const [respCitas, respMascotas] = await Promise.all([
                obtenerProximasConsultas(veterinario),
                obtenerMascotas(),
            ]);

            const soloAgendadas = respCitas.data.data.filter(
                (cita) => cita.estado === "reservada" || cita.estado === "confirmada"
            );

            setCitas(soloAgendadas);
            setMascotas(respMascotas.data.data);

        } catch (error) {

            console.error("Error al cargar las próximas consultas:", error);

            // Si el listado sale vacío por un error real (backend caído,
            // URL mal configurada, etc.) se muestra distinto a "no hay
            // consultas", para no confundir un fallo con que de verdad
            // no haya nada agendado.
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

    async function confirmar(id) {
        try {
            await actualizarCita(id, { estado: "confirmada" });
            cargarDatos();
            if (onCambio) onCambio();
        } catch (error) {
            console.error(error);
            alert("Error al confirmar la cita.");
        }
    }

    async function marcarCompletada(id) {
        try {
            await actualizarCita(id, { estado: "completada" });
            cargarDatos();
            if (onCambio) onCambio();
        } catch (error) {
            console.error(error);
            alert("Error al actualizar la cita.");
        }
    }

    async function cancelar(id) {
        const confirmar = window.confirm("¿Cancelar esta cita?");
        if (!confirmar) return;

        try {
            await cancelarCita(id);
            cargarDatos();
            if (onCambio) onCambio();
        } catch (error) {
            console.error(error);
            alert("Error al cancelar la cita.");
        }
    }

    if (cargando) {
        return <p className="text-gray-500">Cargando consultas...</p>;
    }

    return (
        <div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Mis Próximas Consultas
            </h2>

            {error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">
                    {error}
                </div>
            ) : citas.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-6 text-gray-500">
                    No tienes consultas próximas agendadas.
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
                                <th className="p-4 text-left">Estado</th>
                                <th className="p-4 text-center">Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {citas.map((cita) => (
                                <tr key={cita.id} className="border-b hover:bg-gray-50 text-gray-900">

                                    <td className="p-4">{formatearFechaLarga(cita.fecha)}</td>

                                    <td className="p-4">{cita.hora}</td>

                                    <td className="p-4">{nombreMascota(cita.mascotaId)}</td>

                                    <td className="p-4">{cita.motivo}</td>

                                    <td className="p-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${COLOR_ESTADO_CITA[cita.estado] || "bg-gray-100 text-gray-700"}`}
                                        >
                                            {ETIQUETA_ESTADO_CITA[cita.estado] || cita.estado}
                                        </span>
                                    </td>

                                    <td className="p-4 text-center whitespace-nowrap">

                                        {cita.estado === "reservada" && (
                                            <button
                                                onClick={() => confirmar(cita.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded mr-2"
                                            >
                                                Confirmar
                                            </button>
                                        )}

                                        {cita.estado === "confirmada" && (
                                            <button
                                                onClick={() => marcarCompletada(cita.id)}
                                                className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded mr-2"
                                            >
                                                Completar
                                            </button>
                                        )}

                                        <button
                                            onClick={() => cancelar(cita.id)}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                                        >
                                            Cancelar
                                        </button>

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
