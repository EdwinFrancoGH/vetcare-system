"use client";

import { FaExclamationTriangle, FaCalendarAlt, FaSyringe } from "react-icons/fa";

export default function ListaRecordatorios({ recordatorios = [] }) {
    if (recordatorios.length === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FaExclamationTriangle className="text-amber-500" />
                <span>Recordatorios</span>
                <span className="text-xs font-normal text-gray-500">
                    ({recordatorios.length})
                </span>
            </h2>
            <div className="space-y-2">
                {recordatorios.map((r) => (
                    <div
                        key={r.id}
                        className={`p-3 rounded-lg border text-sm font-medium flex items-center gap-3 ${
                            r.tipo === "vencida"
                                ? "bg-red-50 border-red-200 text-red-800"
                                : r.tipo === "por-vencer"
                                ? "bg-amber-50 border-amber-200 text-amber-800"
                                : "bg-blue-50 border-blue-200 text-blue-800"
                        }`}
                    >
                        {r.tipo === "cita" ? (
                            <FaCalendarAlt className="shrink-0 text-base" />
                        ) : (
                            <FaSyringe className="shrink-0 text-base" />
                        )}
                        <span>{r.mensaje}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
