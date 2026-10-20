"use client";

import { FaMars, FaVenus } from "react-icons/fa";

export default function SelectorSexo({ sexo = "", onSeleccionarSexo, error }) {
    return (
        <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
                Sexo <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div
                className={`grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-lg border ${
                    error ? "border-red-500" : "border-transparent"
                }`}
            >
                <button
                    type="button"
                    onClick={() => onSeleccionarSexo("Macho")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-sm font-semibold transition ${
                        sexo === "Macho"
                            ? "bg-white text-blue-700 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                    <FaMars className="w-4 h-4 text-blue-600" />
                    <span>Macho</span>
                </button>
                <button
                    type="button"
                    onClick={() => onSeleccionarSexo("Hembra")}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-sm font-semibold transition ${
                        sexo === "Hembra"
                            ? "bg-white text-pink-700 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                    <FaVenus className="w-4 h-4 text-pink-600" />
                    <span>Hembra</span>
                </button>
            </div>
            {error && (
                <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
        </div>
    );
}
