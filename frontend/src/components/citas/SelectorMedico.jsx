"use client";

import { FaUserMd } from "react-icons/fa";

export default function SelectorMedico({
    veterinarios = [],
    veterinarioSeleccionado,
    onSeleccionar,
}) {
    if (veterinarios.length === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow p-4 mb-6 border border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {veterinarioSeleccionado ? (
                        veterinarioSeleccionado.charAt(0).toUpperCase()
                    ) : (
                        <FaUserMd />
                    )}
                </div>
                <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Médico
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                        Dr(a). {veterinarioSeleccionado}
                    </p>
                </div>
            </div>

            {veterinarios.length <= 4 ? (
                <div className="flex flex-wrap gap-2">
                    {veterinarios.map((nombre) => (
                        <button
                            key={nombre}
                            type="button"
                            onClick={() => onSeleccionar(nombre)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 border ${
                                veterinarioSeleccionado === nombre
                                    ? "bg-blue-700 text-white border-blue-700 shadow-sm"
                                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                            }`}
                        >
                            <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    veterinarioSeleccionado === nombre
                                        ? "bg-white text-blue-700"
                                        : "bg-blue-100 text-blue-800"
                                }`}
                            >
                                {nombre.charAt(0).toUpperCase()}
                            </span>
                            <span>Dr(a). {nombre}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <label
                        htmlFor="select-medico"
                        className="text-sm font-medium text-gray-700"
                    >
                        Cambiar médico:
                    </label>
                    <select
                        id="select-medico"
                        value={veterinarioSeleccionado}
                        onChange={(e) => onSeleccionar(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {veterinarios.map((nombre) => (
                            <option key={nombre} value={nombre}>
                                Dr(a). {nombre}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}
