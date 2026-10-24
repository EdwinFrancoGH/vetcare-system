"use client";

import { FaSearch, FaTimes, FaSyncAlt } from "react-icons/fa";

const PESTANAS = [
    { clave: "pendiente", etiqueta: "Pendientes" },
    { clave: "listo", etiqueta: "Listos para retirar" },
    { clave: "entregado", etiqueta: "Entregados" },
    { clave: "cancelado", etiqueta: "Cancelados" },
    { clave: "todos", etiqueta: "Todos" }
];

// Pestañas por estado, buscador y botón de actualización
export default function FiltrosPedidos({
    pestanaActiva,
    onCambiarPestana,
    busqueda,
    onCambiarBusqueda,
    conteos = {},
    cargando = false,
    onRecargar
}) {
    return (
        <div className="space-y-4">
            {/* Barra superior: Buscador y botón Actualizar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative max-w-md w-full">
                    <FaSearch
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                        size={14}
                        aria-hidden="true"
                    />
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => onCambiarBusqueda(e.target.value)}
                        placeholder="Buscar por cliente o # de pedido (ej: ABC123)..."
                        className="w-full pl-10 pr-9 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-sm transition"
                    />
                    {busqueda && (
                        <button
                            type="button"
                            onClick={() => onCambiarBusqueda("")}
                            aria-label="Limpiar búsqueda"
                            title="Limpiar búsqueda"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition"
                        >
                            <FaTimes size={13} />
                        </button>
                    )}
                </div>

                <button
                    type="button"
                    onClick={onRecargar}
                    disabled={cargando}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                    <FaSyncAlt size={12} className={cargando ? "animate-spin text-blue-700" : ""} />
                    <span>Actualizar</span>
                </button>
            </div>

            {/* Pestañas con contador */}
            <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-2">
                {PESTANAS.map((pestana) => {
                    const activa = pestanaActiva === pestana.clave;
                    const cantidad = conteos[pestana.clave] || 0;

                    return (
                        <button
                            key={pestana.clave}
                            type="button"
                            onClick={() => onCambiarPestana(pestana.clave)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                                activa
                                    ? "bg-blue-700 text-white shadow-sm"
                                    : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                            }`}
                        >
                            <span>{pestana.etiqueta}</span>
                            <span
                                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                    activa
                                        ? "bg-blue-800 text-blue-100"
                                        : "bg-zinc-100 text-zinc-600"
                                }`}
                            >
                                {cantidad}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
