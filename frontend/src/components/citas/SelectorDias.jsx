"use client";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { formatearFechaLarga } from "../../utils/citas";

function formatearChipDia(fechaISO) {
    if (!fechaISO) return "";
    const [anio, mes, dia] = fechaISO.split("-").map(Number);
    const d = new Date(Date.UTC(anio, mes - 1, dia));
    const nom = d
        .toLocaleDateString("es-ES", { weekday: "short", timeZone: "UTC" })
        .replace(".", "");
    const cap = nom.charAt(0).toUpperCase() + nom.slice(1);
    return `${cap} ${dia}`;
}

export default function SelectorDias({
    inicioSemana,
    finSemana,
    esSemanaActual,
    onSemanaAnterior,
    onSemanaSiguiente,
    onIrAHoy,
    diasDeLaSemana = [],
    diaSeleccionado,
    onSeleccionarDia,
}) {
    return (
        <>
            <div className="flex items-center justify-between bg-white rounded-xl shadow p-4 mb-6 gap-2">
                <button
                    type="button"
                    onClick={onSemanaAnterior}
                    disabled={esSemanaActual}
                    aria-label="Semana anterior"
                    title="Semana anterior"
                    className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition"
                >
                    <FaChevronLeft className="text-xs" />
                    <span className="hidden sm:inline">Semana anterior</span>
                </button>

                <div className="flex items-center gap-2 sm:gap-3">
                    <p className="font-semibold text-gray-800 capitalize text-center text-xs sm:text-sm">
                        {formatearFechaLarga(inicioSemana)} — {formatearFechaLarga(finSemana)}
                    </p>
                    {!esSemanaActual && (
                        <button
                            type="button"
                            onClick={onIrAHoy}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                        >
                            Hoy
                        </button>
                    )}
                </div>

                <button
                    type="button"
                    onClick={onSemanaSiguiente}
                    aria-label="Semana siguiente"
                    title="Semana siguiente"
                    className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                    <span className="hidden sm:inline">Semana siguiente</span>
                    <FaChevronRight className="text-xs" />
                </button>
            </div>

            <div className="mb-6 overflow-x-auto pb-2">
                <div className="flex gap-2 min-w-max">
                    {diasDeLaSemana.map((dia) => {
                        const esSeleccionado = dia.fecha === diaSeleccionado;
                        const deshabilitado = dia.esPasado || dia.libres === 0;

                        return (
                            <button
                                key={dia.fecha}
                                type="button"
                                disabled={deshabilitado}
                                onClick={() => onSeleccionarDia(dia.fecha)}
                                className={`flex-1 min-w-[105px] sm:min-w-[120px] p-3 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                                    esSeleccionado
                                        ? "bg-blue-700 text-white border-blue-700 shadow-md ring-2 ring-blue-300"
                                        : deshabilitado
                                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
                                        : "bg-white text-gray-800 border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                                }`}
                            >
                                <span className="text-sm font-bold capitalize">
                                    {formatearChipDia(dia.fecha)}
                                </span>
                                <span
                                    className={`text-xs mt-1 font-medium ${
                                        esSeleccionado
                                            ? "text-blue-100"
                                            : deshabilitado
                                            ? "text-gray-400"
                                            : "text-blue-600 font-semibold"
                                    }`}
                                >
                                    {deshabilitado
                                        ? "Sin horarios"
                                        : `${dia.libres} ${
                                              dia.libres === 1 ? "libre" : "libres"
                                          }`}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
