"use client";

import { FaUser, FaEnvelope, FaCalendarAlt, FaClock } from "react-icons/fa";
import { formatearFechaPedido, formatearHoraPedido } from "../../utils/fechasPedido";
import {
    obtenerFechaLimitePedido,
    esVencimientoProximo
} from "../../utils/vencimientoPedido";
import EstadoPedido from "../tienda/EstadoPedido";
import AccionesPedido from "./AccionesPedido";

// Tarjeta con información completa del pedido para el personal de la clínica
export default function TarjetaPedidoPersonal({
    pedido,
    onMarcarListo,
    onEntregar,
    onCancelar,
    onExtender,
    procesando = false
}) {
    const idCorto = (pedido.id || "").slice(0, 6).toUpperCase();
    const fecha = formatearFechaPedido(pedido.fechaPedido);
    const hora = formatearHoraPedido(pedido.fechaPedido);
    const tipoEtiqueta = pedido.tipo === "en_linea"
        ? "En línea (prueba)"
        : "Retiro en clínica";

    const fechaLimite = obtenerFechaLimitePedido(pedido);
    const mostrarRetiro = pedido.tipo === "retiro"
        && (pedido.estado === "pendiente" || pedido.estado === "listo")
        && fechaLimite;
    const fechaLimiteTexto = mostrarRetiro ? formatearFechaPedido(fechaLimite) : "";
    const vencePronto = mostrarRetiro ? esVencimientoProximo(fechaLimite) : false;
    const extensiones = Number(pedido.extensiones || 0);
    const extensionesTexto = extensiones === 1 ? "1 vez" : `${extensiones} veces`;


    return (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition">
            {/* Cabecera: ID, fecha/hora, tipo y estado */}
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-zinc-100 pb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-zinc-900">
                            #{idCorto}
                        </span>
                        <EstadoPedido estado={pedido.estado} />
                        {pedido.pagado ? (
                            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Pagado
                            </span>
                        ) : (
                            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                Por cobrar
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                        <span className="flex items-center gap-1">
                            <FaCalendarAlt size={10} />
                            {fecha}
                        </span>
                        {hora && (
                            <span className="flex items-center gap-1">
                                <FaClock size={10} />
                                {hora}
                            </span>
                        )}
                        <span className="text-zinc-500 font-medium">
                            · {tipoEtiqueta}
                        </span>
                    </div>

                    {/* Plazo de retiro para pedidos pendientes o listos */}
                    {mostrarRetiro && (
                        <div className={`text-xs flex items-center flex-wrap gap-1.5 mt-1.5 ${
                            vencePronto ? "text-red-600 font-semibold" : "text-zinc-500"
                        }`}>
                            <FaClock size={11} />
                            <span>Retirar antes del {fechaLimiteTexto}</span>
                            {extensiones > 0 && (
                                <span className="text-zinc-400 font-normal">
                                    (plazo extendido {extensionesTexto})
                                </span>
                            )}
                        </div>
                    )}

                    {/* Motivo de cancelación */}
                    {pedido.estado === "cancelado" && pedido.motivoCancelacion && (
                        <p className="text-[11px] text-zinc-400 italic mt-1">
                            {pedido.motivoCancelacion}
                        </p>
                    )}
                </div>

                <div className="text-right">
                    <span className="text-xs text-zinc-400 block">Total</span>
                    <span className="text-lg font-extrabold text-blue-950">
                        ${(Number(pedido.total) || 0).toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Datos del cliente */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600 bg-zinc-50/70 p-2.5 rounded-lg border border-zinc-100">
                <span className="flex items-center gap-1.5 font-semibold text-zinc-800">
                    <FaUser size={11} className="text-zinc-400" />
                    {pedido.clienteNombre || "Cliente"}
                </span>
                {pedido.clienteEmail && (
                    <span className="flex items-center gap-1.5 text-zinc-500">
                        <FaEnvelope size={11} className="text-zinc-400" />
                        {pedido.clienteEmail}
                    </span>
                )}
            </div>

            {/* Lista detallada de productos */}
            <div className="space-y-1 text-xs text-zinc-700 bg-white border border-zinc-100 p-3 rounded-lg">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Productos ({pedido.productos?.length || 0})
                </span>
                {(pedido.productos || []).map((prod, idx) => (
                    <div key={idx} className="flex justify-between items-center py-0.5">
                        <span className="truncate pr-2">
                            {prod.cantidad}x {prod.nombre}
                        </span>
                        <span className="font-semibold text-zinc-800 flex-shrink-0">
                            ${(Number(prod.subtotal) || 0).toFixed(2)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Pie con acciones */}
            <div className="flex items-center justify-end pt-2 border-t border-zinc-100">
                <AccionesPedido
                    pedido={pedido}
                    onMarcarListo={onMarcarListo}
                    onEntregar={onEntregar}
                    onCancelar={onCancelar}
                    onExtender={onExtender}
                    procesando={procesando}
                />
            </div>
        </div>
    );
}

