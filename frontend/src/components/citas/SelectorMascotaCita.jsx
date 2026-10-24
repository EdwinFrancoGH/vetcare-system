"use client";

import { obtenerEspecie } from "../../utils/especies";

export default function SelectorMascotaCita({
    esCliente,
    mascotas = [],
    mascotaId,
    onSeleccionar,
    onChange,
    error,
}) {
    return (
        <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Mascota <span className="text-red-500 ml-0.5">*</span>
            </label>

            {esCliente ? (
                <div>
                    {mascotas.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-300 p-4 text-center bg-gray-50/50">
                            <p className="text-xs sm:text-sm text-gray-600">
                                Aún no tienes mascotas registradas. Regístrala primero en el menú &quot;Mascotas&quot;.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {mascotas.map((m) => {
                                const esp = obtenerEspecie(m.especie);
                                const Icono = esp.icon;
                                const inicial = m.nombre ? m.nombre.charAt(0).toUpperCase() : "?";
                                const seleccionada = mascotaId === m.id;

                                return (
                                    <button
                                        type="button"
                                        key={m.id}
                                        onClick={() => onSeleccionar(m.id)}
                                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition ${
                                            seleccionada
                                                ? "border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20"
                                                : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
                                        }`}
                                    >
                                        <div
                                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${esp.bg}`}
                                        >
                                            {inicial ? <span>{inicial}</span> : <Icono className="w-4 h-4" />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                                                {m.nombre}
                                            </p>
                                            <p className="text-[11px] text-gray-500 truncate">
                                                {m.especie || "Mascota"}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <select
                    name="mascotaId"
                    value={mascotaId}
                    onChange={onChange}
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 ${
                        error
                            ? "border-red-500 focus:ring-red-400 bg-red-50/20"
                            : "border-gray-300 focus:ring-blue-500"
                    }`}
                >
                    <option value="">Seleccione una mascota</option>
                    {mascotas.map((mascota) => (
                        <option key={mascota.id} value={mascota.id}>
                            {`${mascota.nombre} (${mascota.propietario})`}
                        </option>
                    ))}
                </select>
            )}

            {error && (
                <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
        </div>
    );
}
