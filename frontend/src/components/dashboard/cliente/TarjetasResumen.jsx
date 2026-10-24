"use client";

import { FaDog, FaCalendarAlt, FaCheckCircle, FaSyringe } from "react-icons/fa";

export default function TarjetasResumen({
    totalMascotas,
    totalProximas,
    vacunasVencidas = [],
    vacunasPorVencer = [],
    totalVacunasPendientes = 0,
}) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <FaDog className="text-2xl" />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Mis mascotas</p>
                    <p className="text-3xl font-bold text-gray-900">{totalMascotas}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                    <FaCalendarAlt className="text-2xl" />
                </div>
                <div>
                    <p className="text-sm text-gray-500">Próximas citas</p>
                    <p className="text-3xl font-bold text-gray-900">{totalProximas}</p>
                </div>
            </div>

            <div
                className={`rounded-xl shadow p-5 flex items-center gap-4 border ${
                    vacunasVencidas.length > 0
                        ? "bg-red-50 border-red-200 text-red-700"
                        : vacunasPorVencer.length > 0
                        ? "bg-amber-50 border-amber-200 text-amber-800"
                        : "bg-green-50 border-green-200 text-green-700"
                }`}
            >
                <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        vacunasVencidas.length > 0
                            ? "bg-red-100 text-red-700"
                            : vacunasPorVencer.length > 0
                            ? "bg-amber-100 text-amber-800"
                            : "bg-green-100 text-green-700"
                    }`}
                >
                    {totalVacunasPendientes === 0 ? (
                        <FaCheckCircle className="text-2xl" />
                    ) : (
                        <FaSyringe className="text-2xl" />
                    )}
                </div>
                <div>
                    <p className="text-sm font-medium opacity-90">Vacunas pendientes</p>
                    {totalVacunasPendientes === 0 ? (
                        <p className="text-xl font-bold">Todo al día ✓</p>
                    ) : (
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold">{totalVacunasPendientes}</p>
                            <span className="text-xs font-semibold">
                                {vacunasVencidas.length > 0
                                    ? `(${vacunasVencidas.length} ${vacunasVencidas.length === 1 ? "vencida" : "vencidas"})`
                                    : `(${vacunasPorVencer.length} por vencer)`}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
