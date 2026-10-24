"use client";

import { FaPrint, FaSyringe } from "react-icons/fa";
import { hoyISO, sumarDiasISO, formatearFechaCorta } from "../../../utils/citas";
import { ultimaDosisPorVacuna } from "../../../utils/estadoClinico";

export default function CarnetVacunas({ vacunas = [], nombreMascota = "", tabActiva }) {
    const idsUltimaDosis = new Set(
        ultimaDosisPorVacuna(vacunas).map((v) => v.id)
    );
    const hoy = hoyISO();
    const limite30Dias = sumarDiasISO(hoy, 30);

    return (
        <div
            className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 print:shadow-none print:p-0 print:border-none print:mt-4 print:rounded-none ${
                tabActiva === "vacunas" ? "block" : "hidden print:block"
            }`}
        >
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 print:text-lg">
                        Carnet de vacunas
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5 print:hidden">
                        Registro de vacunas aplicadas y próximas fechas de refuerzo
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => window.print()}
                    aria-label="Imprimir carnet"
                    title="Imprimir carnet"
                    className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-xl transition shadow-sm print:hidden"
                >
                    <FaPrint className="text-xs" />
                    <span>Imprimir carnet</span>
                </button>
            </div>

            {vacunas.length === 0 ? (
                <div className="py-8 text-center flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                        <FaSyringe className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-gray-800 text-sm mb-1">
                        Sin vacunas registradas
                    </p>
                    <p className="text-xs text-gray-500">
                        No se han registrado aplicaciones de vacunas para {nombreMascota} todavía.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto print:overflow-visible">
                    <table className="min-w-full text-left print:w-full print:border-collapse">
                        <thead
                            className="bg-blue-900 text-white"
                            style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                        >
                            <tr>
                                <th className="p-3.5 print:p-2.5 print:border-b print:border-gray-300 text-xs sm:text-sm font-semibold">
                                    Vacuna
                                </th>
                                <th className="p-3.5 print:p-2.5 print:border-b print:border-gray-300 text-xs sm:text-sm font-semibold">
                                    Fecha de aplicación
                                </th>
                                <th className="p-3.5 print:p-2.5 print:border-b print:border-gray-300 text-xs sm:text-sm font-semibold">
                                    Próxima dosis
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 print:divide-gray-200">
                            {vacunas.map((vacuna) => {
                                const fechaProx = (vacuna.proximaFecha || "").slice(0, 10);
                                const esUltimaDosis = idsUltimaDosis.has(vacuna.id);
                                const esVencida = fechaProx && fechaProx < hoy;
                                const esProxima = fechaProx && fechaProx >= hoy && fechaProx <= limite30Dias;

                                return (
                                    <tr
                                        key={vacuna.id}
                                        className="hover:bg-gray-50 text-gray-900 print:hover:bg-transparent text-xs sm:text-sm"
                                    >
                                        <td className="p-3.5 print:p-2.5 font-medium">{vacuna.nombre}</td>
                                        <td className="p-3.5 print:p-2.5">
                                            {formatearFechaCorta(vacuna.fecha)}
                                        </td>
                                        <td className="p-3.5 print:p-2.5">
                                            {vacuna.proximaFecha ? (
                                                esUltimaDosis ? (
                                                    <span
                                                        style={{
                                                            WebkitPrintColorAdjust: "exact",
                                                            printColorAdjust: "exact",
                                                        }}
                                                        className={
                                                            esVencida
                                                                ? "text-red-700 bg-red-100 px-2.5 py-1 rounded-full text-xs font-semibold inline-block"
                                                                : esProxima
                                                                ? "text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full text-xs font-semibold inline-block"
                                                                : "text-gray-700 font-medium"
                                                        }
                                                    >
                                                        {formatearFechaCorta(vacuna.proximaFecha)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">
                                                        {formatearFechaCorta(vacuna.proximaFecha)} (refuerzo aplicado)
                                                    </span>
                                                )
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-xs text-gray-500">
                Impreso el {formatearFechaCorta(hoy)}
            </div>
        </div>
    );
}
