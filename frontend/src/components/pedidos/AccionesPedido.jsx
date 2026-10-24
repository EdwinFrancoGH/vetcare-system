"use client";

import { FaCheck, FaBan, FaCheckDouble, FaCheckCircle, FaClock } from "react-icons/fa";

// Botones de acción contextuales según el estado del pedido
export default function AccionesPedido({
    pedido,
    onMarcarListo,
    onEntregar,
    onCancelar,
    onExtender,
    procesando = false
}) {
    const estado = pedido.estado;

    if (estado === "entregado") {
        return (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <FaCheckCircle size={13} />
                <span>Venta registrada</span>
            </div>
        );
    }

    if (estado === "cancelado") {
        return null;
    }

    const puedeExtender = pedido.tipo === "retiro"
        && !pedido.pagado
        && (estado === "pendiente" || estado === "listo");

    return (
        <div className="flex flex-wrap items-center gap-2">
            {estado === "pendiente" && (
                <button
                    type="button"
                    onClick={() => onMarcarListo(pedido)}
                    disabled={procesando}
                    className="py-1.5 px-3 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                >
                    <FaCheck size={11} />
                    <span>Marcar listo</span>
                </button>
            )}

            {estado === "listo" && (
                <button
                    type="button"
                    onClick={() => onEntregar(pedido)}
                    disabled={procesando}
                    className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                >
                    <FaCheckDouble size={11} />
                    <span>Entregar</span>
                </button>
            )}

            {puedeExtender && onExtender && (
                <button
                    type="button"
                    onClick={() => onExtender(pedido)}
                    disabled={procesando}
                    className="py-1.5 px-3 bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
                >
                    <FaClock size={11} />
                    <span>Dar más tiempo</span>
                </button>
            )}

            <button
                type="button"
                onClick={() => onCancelar(pedido)}
                disabled={procesando}
                className="py-1.5 px-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
            >
                <FaBan size={11} />
                <span>Cancelar</span>
            </button>
        </div>
    );
}

