"use client";

import { useMemo } from "react";
import { FaCalendarAlt, FaClock } from "react-icons/fa";
import { formatearFechaLarga } from "../../utils/citas";

export default function HorariosDelDia({
    fecha,
    citas = [],
    onSeleccionarCita,
}) {
    const citasManana = useMemo(() => {
        return (citas || []).filter((c) => {
            const horaNum = parseInt(c.hora.split(":")[0], 10);
            return horaNum < 12;
        });
    }, [citas]);

    const citasTarde = useMemo(() => {
        return (citas || []).filter((c) => {
            const horaNum = parseInt(c.hora.split(":")[0], 10);
            return horaNum >= 12;
        });
    }, [citas]);

    return (
        <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 capitalize flex items-center gap-2">
                <FaCalendarAlt className="text-blue-700 text-lg" />
                <span>{formatearFechaLarga(fecha)}</span>
            </h3>

            {citas.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-400 flex items-center justify-center mb-3">
                        <FaCalendarAlt className="text-3xl" />
                    </div>
                    <p className="text-gray-700 font-semibold text-base">
                        No hay horarios disponibles este día.
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                        Prueba otro día o cambia de médico.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {citasManana.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                                <span>Mañana (antes de 12:00)</span>
                                <span className="text-blue-700 font-semibold">
                                    ({citasManana.length})
                                </span>
                            </h4>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                {citasManana.map((cita) => (
                                    <button
                                        key={`${cita.fecha}_${cita.hora}`}
                                        type="button"
                                        onClick={() => onSeleccionarCita(cita)}
                                        className="py-3 px-2 rounded-xl border border-blue-600 bg-white text-blue-700 hover:bg-blue-700 hover:text-white transition font-semibold text-base shadow-sm flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <FaClock className="text-xs opacity-70" />
                                        <span>{cita.hora}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {citasTarde.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                                <span>Tarde (12:00 en adelante)</span>
                                <span className="text-blue-700 font-semibold">
                                    ({citasTarde.length})
                                </span>
                            </h4>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                {citasTarde.map((cita) => (
                                    <button
                                        key={`${cita.fecha}_${cita.hora}`}
                                        type="button"
                                        onClick={() => onSeleccionarCita(cita)}
                                        className="py-3 px-2 rounded-xl border border-blue-600 bg-white text-blue-700 hover:bg-blue-700 hover:text-white transition font-semibold text-base shadow-sm flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <FaClock className="text-xs opacity-70" />
                                        <span>{cita.hora}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
