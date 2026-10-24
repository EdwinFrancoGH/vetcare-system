"use client";

import { FaSearch, FaTimes } from "react-icons/fa";

// Barra de búsqueda y chips de filtro por categoría
export default function FiltrosTienda({
    busqueda,
    onCambiarBusqueda,
    categoriaSeleccionada,
    onSeleccionarCategoria,
    categorias = []
}) {
    return (
        <div className="space-y-4">
            {/* Input de búsqueda */}
            <div className="relative max-w-md">
                <FaSearch
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                    size={14}
                    aria-hidden="true"
                />
                <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => onCambiarBusqueda(e.target.value)}
                    placeholder="Buscar productos por nombre..."
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

            {/* Chips de categorías */}
            {categorias.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                        type="button"
                        onClick={() => onSeleccionarCategoria("")}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                            categoriaSeleccionada === ""
                                ? "bg-blue-700 text-white shadow-sm"
                                : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                        }`}
                    >
                        Todas
                    </button>
                    {categorias.map((cat) => {
                        const activa = categoriaSeleccionada === cat;
                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => onSeleccionarCategoria(cat)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                                    activa
                                        ? "bg-blue-700 text-white shadow-sm"
                                        : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                                }`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
