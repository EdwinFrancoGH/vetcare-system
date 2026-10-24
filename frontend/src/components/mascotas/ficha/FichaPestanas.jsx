"use client";

import { FaNotesMedical, FaHistory, FaSyringe } from "react-icons/fa";

export default function FichaPestanas({
    tabActiva,
    setTabActiva,
    totalHistorial = 0,
    totalVacunas = 0,
    tieneAlertas = false,
}) {
    return (
        <div className="border-b border-gray-200 overflow-x-auto scrollbar-none print:hidden">
            <nav className="flex gap-2 sm:gap-6 min-w-max pb-0.5">
                <button
                    type="button"
                    onClick={() => setTabActiva("resumen")}
                    className={`flex items-center gap-2 py-3 px-3 text-sm font-bold border-b-2 transition ${
                        tabActiva === "resumen"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                    <FaNotesMedical className="w-4 h-4" />
                    <span>Resumen</span>
                    {tieneAlertas && (
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => setTabActiva("historial")}
                    className={`flex items-center gap-2 py-3 px-3 text-sm font-bold border-b-2 transition ${
                        tabActiva === "historial"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                    <FaHistory className="w-4 h-4" />
                    <span>Historial</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        {totalHistorial}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setTabActiva("vacunas")}
                    className={`flex items-center gap-2 py-3 px-3 text-sm font-bold border-b-2 transition ${
                        tabActiva === "vacunas"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                    <FaSyringe className="w-4 h-4" />
                    <span>Vacunas</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        {totalVacunas}
                    </span>
                </button>
            </nav>
        </div>
    );
}
