"use client";

import { ESPECIES } from "../../../utils/especies";

export default function SelectorEspecie({
    especie = "",
    esOtroSeleccionado = false,
    onSeleccionarEspecie,
    especieOtroTexto = "",
    onChangeOtro,
    error,
}) {
    return (
        <div className="col-span-1 md:col-span-2">
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Especie <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                {ESPECIES.map((op) => {
                    const Icon = op.icon;
                    const seleccionada =
                        especie === op.id || (op.id === "Otro" && esOtroSeleccionado);

                    return (
                        <button
                            type="button"
                            key={op.id}
                            onClick={() => onSeleccionarEspecie(op.id)}
                            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition ${
                                seleccionada
                                    ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm ring-2 ring-blue-500/20"
                                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                            }`}
                        >
                            <Icon className="w-5 h-5 mb-1 shrink-0" />
                            <span className="truncate">{op.label}</span>
                        </button>
                    );
                })}
            </div>

            {esOtroSeleccionado && (
                <div className="mt-2.5">
                    <label className="text-xs font-medium text-gray-600 block mb-1">
                        Especifica la especie <span className="text-gray-400 font-normal">(opcional)</span>
                    </label>
                    <input
                        type="text"
                        name="especieOtro"
                        value={especieOtroTexto}
                        onChange={onChangeOtro}
                        placeholder="Ej: Hurón, Erizo, Caballo, etc."
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            )}

            {error && (
                <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
        </div>
    );
}
