"use client";

import Link from "next/link";
import { FaCalendarAlt, FaTimes } from "react-icons/fa";
import { formatearFechaLarga, COLOR_ESTADO_CITA, ETIQUETA_ESTADO_CITA } from "../../../utils/citas";
import BotonAgregarCalendar from "../../ui/BotonAgregarCalendar";

const ESTADOS_ACTIVOS = ["reservada", "confirmada"];

export default function TablaProximasCitas({
    proximas = [],
    mascotas = [],
    filtroMascota = "",
    setFiltroMascota,
    handleCancelarCita,
    cancelandoId,
    nombreMascota,
}) {
    const proximasFiltradas = filtroMascota
        ? proximas.filter((c) => c.mascotaId === filtroMascota)
        : proximas;

    return (
        <div className="space-y-4">
            {mascotas.length > 1 && (
                <div className="flex items-center gap-3 bg-white rounded-xl shadow p-4">
                    <label htmlFor="filtro-mascota" className="text-sm font-medium text-gray-700">
                        Filtrar por mascota:
                    </label>
                    <select
                        id="filtro-mascota"
                        value={filtroMascota}
                        onChange={(e) => setFiltroMascota(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Todas las mascotas</option>
                        {mascotas.map((m) => (
                            <option key={m.id} value={m.id}>
                                {m.nombre}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="px-5 py-4 border-b font-semibold text-gray-800">
                    Mis próximas citas
                </div>

                {proximasFiltradas.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center">
                        <FaCalendarAlt className="text-4xl text-gray-300 mb-2" />
                        <p className="text-gray-500 mb-3">
                            {filtroMascota
                                ? "No hay citas próximas para esta mascota."
                                : "No tienes citas próximas."}
                        </p>
                        <Link
                            href="/citas"
                            className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-sm"
                        >
                            <FaCalendarAlt className="text-xs" /> Agendar una cita
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-blue-900 text-white">
                                <tr>
                                    <th className="p-3 text-left">Fecha</th>
                                    <th className="p-3 text-left">Hora</th>
                                    <th className="p-3 text-left">Mascota</th>
                                    <th className="p-3 text-left">Veterinario</th>
                                    <th className="p-3 text-left">Estado</th>
                                    <th className="p-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {proximasFiltradas.map((c) => (
                                    <tr key={c.id} className="border-b text-gray-900 hover:bg-gray-50">
                                        <td className="p-3 capitalize">{formatearFechaLarga(c.fecha)}</td>
                                        <td className="p-3">{c.hora}</td>
                                        <td className="p-3 font-medium">{nombreMascota(c.mascotaId)}</td>
                                        <td className="p-3">{c.veterinario}</td>
                                        <td className="p-3">
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    COLOR_ESTADO_CITA[c.estado] || "bg-gray-100 text-gray-700"
                                                }`}
                                            >
                                                {ETIQUETA_ESTADO_CITA[c.estado] || c.estado}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <BotonAgregarCalendar
                                                    titulo={`Cita veterinaria de ${nombreMascota(c.mascotaId)}`}
                                                    fecha={c.fecha}
                                                    hora={c.hora}
                                                    duracionMinutos={c.duracionMinutos || 30}
                                                    detalles={`Veterinario: Dr(a). ${c.veterinario}${c.motivo ? `\nMotivo: ${c.motivo}` : ""}`}
                                                    className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-medium px-2.5 py-1.5 rounded transition"
                                                >
                                                    <FaCalendarAlt className="text-xs" />
                                                    <span>Agregar a mi calendario</span>
                                                </BotonAgregarCalendar>

                                                {ESTADOS_ACTIVOS.includes(c.estado) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCancelarCita(c)}
                                                        disabled={cancelandoId === c.id}
                                                        aria-label="Cancelar cita"
                                                        title="Cancelar cita"
                                                        className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-3 py-1.5 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <FaTimes className="text-xs" />
                                                        {cancelandoId === c.id ? "Cancelando..." : "Cancelar"}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
