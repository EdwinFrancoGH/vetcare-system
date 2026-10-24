"use client";

import Link from "next/link";
import {
    FaPaw,
    FaSyringe,
    FaEdit,
    FaTrash,
} from "react-icons/fa";
import { formatearEdad, formatearFechaCorta, hoyISO } from "../../utils/citas";
import { ultimaDosisPorVacuna } from "../../utils/estadoClinico";
import { obtenerEspecie } from "../../utils/especies";

export default function MascotaCard({ mascota, vacunas = [], onEditar, onEliminar }) {
    const configEspecie = obtenerEspecie(mascota.especie);
    const avatarBg = configEspecie.bg;
    const iconBadgeColor = configEspecie.iconBadgeColor;
    const IconoEspecie = configEspecie.icon;

    // Cálculo de próxima vacuna usando ultimaDosisPorVacuna
    const hoy = hoyISO();
    const vacunasFiltradas = ultimaDosisPorVacuna(vacunas || []);
    const vacunasConProxima = vacunasFiltradas.filter((v) => !!v.proximaFecha);

    let proximaVacunaInfo = null;

    if (vacunasConProxima.length > 0) {
        // Ordenar por proximaFecha ascendente
        vacunasConProxima.sort((a, b) => {
            const fa = (a.proximaFecha || "").slice(0, 10);
            const fb = (b.proximaFecha || "").slice(0, 10);
            return fa.localeCompare(fb);
        });

        const proxima = vacunasConProxima[0];
        const fechaIso = (proxima.proximaFecha || "").slice(0, 10);
        const esVencida = fechaIso < hoy;

        const diffMs = new Date(fechaIso + "T00:00:00") - new Date(hoy + "T00:00:00");
        const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));
        const esAmarillo = !esVencida && diffDias <= 30;

        let estiloColor = "text-gray-700 bg-gray-50 border-gray-200";
        let iconoColor = "text-gray-500";

        if (esVencida) {
            estiloColor = "text-red-700 bg-red-50 border-red-200";
            iconoColor = "text-red-600";
        } else if (esAmarillo) {
            estiloColor = "text-amber-800 bg-amber-50 border-amber-200";
            iconoColor = "text-amber-600";
        }

        proximaVacunaInfo = {
            texto: `Próxima vacuna: ${proxima.nombre || "Vacuna"} – ${formatearFechaCorta(fechaIso)}`,
            estiloColor,
            iconoColor,
        };
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-5 flex flex-col justify-between">
            <div>
                {/* Cabecera: Avatar, Datos básicos y botones discretos */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar circular con inicial y badge de especie */}
                        <div className="relative shrink-0">
                            <div
                                className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-2xl border ${avatarBg}`}
                            >
                                {(mascota.nombre || "?").charAt(0).toUpperCase()}
                            </div>
                            <div
                                className={`absolute -bottom-1 -right-1 p-1 rounded-full bg-white shadow-sm border ${iconBadgeColor}`}
                            >
                                <IconoEspecie className="w-3.5 h-3.5" />
                            </div>
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-xl font-bold text-gray-900 truncate" title={mascota.nombre}>
                                    {mascota.nombre}
                                </h3>
                                {mascota.estado && mascota.estado !== "Activo" && (
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                            mascota.estado === "En tratamiento"
                                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                                : "bg-gray-200 text-gray-700 border border-gray-300"
                                        }`}
                                    >
                                        {mascota.estado}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-500 font-medium truncate">
                                {mascota.especie || "Mascota"} · {mascota.raza || "Mestizo"}
                            </p>
                        </div>
                    </div>

                    {/* Botones secundarios discretos */}
                    <div className="flex items-center space-x-1 shrink-0">
                        <button
                            type="button"
                            onClick={() => onEditar(mascota)}
                            aria-label="Editar mascota"
                            title="Editar mascota"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <FaEdit className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onEliminar(mascota.id)}
                            aria-label="Eliminar mascota"
                            title="Eliminar mascota"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <FaTrash className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Chips de Sexo y Edad */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    {mascota.sexo && (
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                            {mascota.sexo}
                        </span>
                    )}
                    <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                        {formatearEdad(mascota.fechaNacimiento, mascota.edad)}
                    </span>
                </div>

                {/* Estado de Vacuna */}
                <div className="mt-4">
                    {proximaVacunaInfo ? (
                        <div
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${proximaVacunaInfo.estiloColor}`}
                        >
                            <FaSyringe className={`w-3.5 h-3.5 shrink-0 ${proximaVacunaInfo.iconoColor}`} />
                            <span className="truncate">{proximaVacunaInfo.texto}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border bg-gray-50 border-gray-200 text-gray-500">
                            <FaSyringe className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                            <span>Sin vacunas pendientes</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Botones principales */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-5">
                <Link
                    href={`/mascotas/${mascota.id}`}
                    className="flex-1 text-center bg-blue-700 hover:bg-blue-800 text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors shadow-sm"
                >
                    Ver ficha
                </Link>
                <Link
                    href="/citas"
                    className="flex-1 text-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors shadow-sm"
                >
                    Agendar cita
                </Link>
            </div>
        </div>
    );
}
