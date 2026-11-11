"use client";

import { useState } from "react";
import { FaCartPlus, FaMinus, FaPlus } from "react-icons/fa";
import { limitarCantidadProducto } from "../../utils/productoTienda";

export default function AgregarProductoCarrito({ producto, onAgregar, detalle = false }) {
    const [cantidad, setCantidad] = useState(1);
    const [agregadoReciente, setAgregadoReciente] = useState(false);
    const stock = Number(producto.stock) || 0;
    const cantidadValida = limitarCantidadProducto(cantidad, stock);

    const agregar = () => {
        if (!cantidadValida) return;
        onAgregar(producto, cantidadValida);
        setAgregadoReciente(true);
        setTimeout(() => setAgregadoReciente(false), 1500);
    };

    return (
        <div className={`flex items-center gap-2 ${detalle ? "flex-wrap" : ""}`}>
            <div className="flex items-center border border-zinc-200 rounded-lg bg-zinc-50 overflow-hidden">
                <button
                    type="button"
                    onClick={() => setCantidad((actual) => Math.max(1, actual - 1))}
                    disabled={!stock || cantidad <= 1}
                    aria-label={`Reducir cantidad de ${producto.nombre}`}
                    className="p-2 text-zinc-600 hover:bg-zinc-200 disabled:opacity-40 transition"
                >
                    <FaMinus size={10} />
                </button>
                <span className="w-8 text-center text-xs font-semibold text-zinc-800" aria-live="polite">
                    {cantidadValida || 0}
                </span>
                <button
                    type="button"
                    onClick={() => setCantidad((actual) => limitarCantidadProducto(actual + 1, stock))}
                    disabled={!stock || cantidadValida >= Math.min(stock, 20)}
                    aria-label={`Aumentar cantidad de ${producto.nombre}`}
                    className="p-2 text-zinc-600 hover:bg-zinc-200 disabled:opacity-40 transition"
                >
                    <FaPlus size={10} />
                </button>
            </div>
            <button
                type="button"
                onClick={agregar}
                disabled={!cantidadValida}
                className={`flex-1 ${detalle ? "py-3 px-5 text-sm" : "py-2 px-3 text-xs"} rounded-lg font-semibold flex items-center justify-center gap-1.5 transition ${
                    agregadoReciente ? "bg-emerald-600 text-white" : "bg-blue-700 hover:bg-blue-800 text-white shadow-sm"
                } disabled:bg-zinc-300 disabled:cursor-not-allowed`}
            >
                <FaCartPlus size={13} />
                <span>{agregadoReciente ? "Agregado al carrito" : stock > 0 ? "Agregar al carrito" : "Agotado"}</span>
            </button>
        </div>
    );
}
