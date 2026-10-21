"use client";

import { FaShoppingBag, FaBan, FaCalendarAlt, FaClock } from "react-icons/fa";
import { formatearFechaPedido } from "../../utils/fechasPedido";
import {
    obtenerFechaLimitePedido,
    esVencimientoProximo
} from "../../utils/vencimientoPedido";
import EstadoPedido from "./EstadoPedido";

// Tarjeta que representa un pedido individual del cliente
export default function TarjetaPedido({ pedido, onCancelar, cancelando = false }) {
    const idCorto = (pedido.id || "").slice(0, 6).toUpperCase();
    const fecha = formatearFechaPedido(pedido.fechaPedido);
    const tipoEtiqueta = pedido.tipo === "en_linea"
        ? "Pagado en línea (prueba)"
        : "Retiro en clínica";

    const fechaLimite = obtenerFechaLimitePedido(pedido);
    const mostrarRetiro = pedido.tipo === "retiro"
        && (pedido.estado === "pendiente" || pedido.estado === "listo")
        && fechaLimite;
    const fechaLimiteTexto = mostrarRetiro ? formatearFechaPedido(fechaLimite) : "";
    const vencePronto = mostrarRetiro ? esVencimientoProximo(fechaLimite) : false;

    return (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition">
            {/* Cabecera con número, fecha y estado */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                        <FaShoppingBag size={14} />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-zinc-900 block">
                            Pedido #{idCorto}
                        </span>
                        <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                            <FaCalendarAlt size={10} />
                            {fecha}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500 font-medium hidden sm:inline">
                        {tipoEtiqueta}
                    </span>
                    <EstadoPedido estado={pedido.estado} />
                </div>
            </div>

            {/* Aviso especial cuando el pedido está listo */}
            {pedido.estado === "listo" && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-semibold text-blue-900 flex items-center gap-2">
                    <span>Tu pedido está listo. Puedes pasar a retirarlo a la clínica.</span>
                </div>
            )}

            {/* Plazo de retiro para pedidos pendientes o listos */}
            {mostrarRetiro && (
                <div className={`text-xs flex items-center gap-1.5 ${
                    vencePronto ? "text-red-600 font-semibold" : "text-zinc-500"
                }`}>
                    <FaClock size={11} />
                    <span>Retirar antes del {fechaLimiteTexto}</span>
                </div>
            )}

            {/* Motivo de cancelación */}
            {pedido.estado === "cancelado" && pedido.motivoCancelacion && (
                <p className="text-[11px] text-zinc-400 italic">
                    {pedido.motivoCancelacion}
                </p>
            )}

            {/* Lista detallada de productos */}
            <div className="space-y-1.5 text-xs text-zinc-700 bg-zinc-50/70 p-3 rounded-lg">
                {(pedido.productos || []).map((prod, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                        <span className="truncate pr-2">
                            {prod.cantidad}x {prod.nombre}
                        </span>
                        <span className="font-semibold text-zinc-900">
                            ${(Number(prod.subtotal) || 0).toFixed(2)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Pie con importe total y acciones */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                <div>
                    <span className="text-[11px] text-zinc-400 block sm:hidden">
                        {tipoEtiqueta}
                    </span>
                    <span className="text-xs text-zinc-500">Total: </span>
                    <span className="text-base font-extrabold text-blue-950">
                        ${(Number(pedido.total) || 0).toFixed(2)}
                    </span>
                </div>

                {pedido.estado === "pendiente" && (
                    <button
                        type="button"
                        onClick={() => onCancelar(pedido)}
                        disabled={cancelando}
                        className="py-1.5 px-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition disabled:opacity-50"
                    >
                        <FaBan size={11} />
                        <span>{cancelando ? "Cancelando..." : "Cancelar pedido"}</span>
                    </button>
                )}
            </div>
        </div>
    );
}
