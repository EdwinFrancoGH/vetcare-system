"use client";

import { useState } from "react";
import {
    FaBoxOpen,
    FaBone,
    FaPills,
    FaPumpSoap,
    FaTag,
    FaBaseballBall,
    FaPlus,
    FaMinus,
    FaCartPlus
} from "react-icons/fa";

// Asigna un ícono según la categoría del producto
function obtenerIconoCategoria(categoria = "") {
    const normalizada = categoria.toLowerCase();
    if (normalizada.includes("alim") || normalizada.includes("comid")) {
        return <FaBone className="text-amber-600" size={26} aria-hidden="true" />;
    }
    if (normalizada.includes("medic") || normalizada.includes("farm")) {
        return <FaPills className="text-emerald-600" size={26} aria-hidden="true" />;
    }
    if (normalizada.includes("hig") || normalizada.includes("limp")) {
        return <FaPumpSoap className="text-cyan-600" size={26} aria-hidden="true" />;
    }
    if (normalizada.includes("juguet")) {
        return <FaBaseballBall className="text-indigo-600" size={26} aria-hidden="true" />;
    }
    if (normalizada.includes("acces")) {
        return <FaTag className="text-purple-600" size={26} aria-hidden="true" />;
    }
    return <FaBoxOpen className="text-blue-600" size={26} aria-hidden="true" />;
}

// Tarjeta individual de producto en el catálogo
export default function ProductoTienda({ producto, onAgregar }) {
    const [cantidad, setCantidad] = useState(1);
    const [agregadoReciente, setAgregadoReciente] = useState(false);

    const stock = Number(producto.stock) || 0;
    const maximo = Math.min(stock, 20);
    const precioFormateado = `$${(Number(producto.precio) || 0).toFixed(2)}`;

    const incrementar = () => {
        setCantidad((prev) => Math.min(prev + 1, maximo));
    };

    const decrementar = () => {
        setCantidad((prev) => Math.max(prev - 1, 1));
    };

    const handleAgregar = () => {
        if (stock <= 0) return;
        onAgregar(producto, cantidad);
        setAgregadoReciente(true);
        setTimeout(() => setAgregadoReciente(false), 1200);
    };

    return (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
                {/* Cabecera de la tarjeta: Icono y badge de categoría */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center flex-shrink-0">
                        {obtenerIconoCategoria(producto.categoria)}
                    </div>
                    <span className="text-[11px] font-medium text-zinc-600 bg-zinc-100 px-2.5 py-0.5 rounded-full">
                        {producto.categoria || "General"}
                    </span>
                </div>

                {/* Título y descripción */}
                <h3
                    className="font-semibold text-zinc-900 text-base line-clamp-1 mb-1"
                    title={producto.nombre}
                >
                    {producto.nombre}
                </h3>
                {producto.descripcion ? (
                    <p
                        className="text-xs text-zinc-500 line-clamp-2 mb-3"
                        title={producto.descripcion}
                    >
                        {producto.descripcion}
                    </p>
                ) : (
                    <div className="h-4 mb-3" />
                )}
            </div>

            <div className="pt-2 border-t border-zinc-100">
                {/* Precio y stock bajo */}
                <div className="flex items-baseline justify-between mb-3">
                    <span className="text-lg font-bold text-blue-900">
                        {precioFormateado}
                    </span>
                    {stock <= 5 && stock > 0 && (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Quedan {stock}
                        </span>
                    )}
                </div>

                {/* Selector de cantidad y botón Agregar */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center border border-zinc-200 rounded-lg bg-zinc-50 overflow-hidden">
                        <button
                            type="button"
                            onClick={decrementar}
                            disabled={cantidad <= 1}
                            aria-label={`Reducir cantidad de ${producto.nombre}`}
                            title="Reducir cantidad"
                            className="p-2 text-zinc-600 hover:bg-zinc-200 disabled:opacity-40 transition"
                        >
                            <FaMinus size={10} />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-zinc-800">
                            {cantidad}
                        </span>
                        <button
                            type="button"
                            onClick={incrementar}
                            disabled={cantidad >= maximo}
                            aria-label={`Aumentar cantidad de ${producto.nombre}`}
                            title="Aumentar cantidad"
                            className="p-2 text-zinc-600 hover:bg-zinc-200 disabled:opacity-40 transition"
                        >
                            <FaPlus size={10} />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleAgregar}
                        disabled={stock <= 0}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                            agregadoReciente
                                ? "bg-emerald-600 text-white"
                                : "bg-blue-700 hover:bg-blue-800 text-white shadow-sm"
                        } disabled:bg-zinc-300 disabled:cursor-not-allowed`}
                    >
                        <FaCartPlus size={13} />
                        <span>{agregadoReciente ? "¡Agregado!" : "Agregar"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
