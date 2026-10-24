"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaTimes, FaClinicMedical, FaCreditCard, FaInfoCircle } from "react-icons/fa";
import Swal from "sweetalert2";
import { crearPedido } from "../../services/tienda.service";

// Modal de confirmación para seleccionar el método de entrega y pago
export default function ModalFinalizarCompra({
    abierto,
    onCerrar,
    items = [],
    total = 0,
    onVaciarCarrito,
    onRecargarCatalogo
}) {
    const router = useRouter();
    const [tipo, setTipo] = useState("retiro");
    const [enviando, setEnviando] = useState(false);

    if (!abierto) return null;

    const handleConfirmar = async () => {
        if (items.length === 0 || enviando) return;

        try {
            setEnviando(true);
            const payload = {
                productos: items.map((it) => ({
                    productoId: it.productoId,
                    cantidad: it.cantidad
                })),
                tipo
            };

            const respuesta = await crearPedido(payload);
            const pedido = respuesta.data.data;
            const numeroCorto = (pedido?.id || "").slice(0, 6).toUpperCase();

            onVaciarCarrito();
            onCerrar();

            const resultado = await Swal.fire({
                title: "¡Pedido confirmado!",
                text: `Tu pedido #${numeroCorto} ha sido registrado con éxito.`,
                icon: "success",
                showCancelButton: true,
                confirmButtonColor: "#1d4ed8",
                cancelButtonColor: "#6b7280",
                confirmButtonText: "Ver mis pedidos",
                cancelButtonText: "Seguir en la tienda"
            });

            if (resultado.isConfirmed) {
                router.push("/tienda/mis-pedidos");
            }
        } catch (error) {
            console.error("Error al crear el pedido:", error);
            const mensaje = error.response?.data?.message
                || "No fue posible procesar tu pedido. Intenta nuevamente.";

            await Swal.fire({
                title: "No se pudo procesar el pedido",
                text: mensaje,
                icon: "error",
                confirmButtonColor: "#1d4ed8"
            });

            if (onRecargarCatalogo) {
                onRecargarCatalogo();
            }
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                onClick={onCerrar}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                aria-hidden="true"
            />

            <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col z-10 overflow-hidden">
                {/* Cabecera */}
                <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-zinc-900">Finalizar Pedido</h3>
                        <p className="text-xs text-zinc-500">
                            Revisa el resumen y elige cómo registrar tu pedido.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onCerrar}
                        aria-label="Cerrar modal"
                        title="Cerrar"
                        className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100"
                    >
                        <FaTimes size={16} />
                    </button>
                </div>

                {/* Contenido con scroll */}
                <div className="p-5 overflow-y-auto space-y-4">
                    {/* Resumen de productos */}
                    <div>
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                            Resumen de compra ({items.length})
                        </h4>
                        <div className="bg-zinc-50 rounded-xl p-3 border border-zinc-200 max-h-36 overflow-y-auto space-y-1.5 text-xs">
                            {items.map((it) => (
                                <div key={it.productoId} className="flex justify-between text-zinc-700">
                                    <span className="truncate pr-2">
                                        {it.cantidad}x {it.nombre}
                                    </span>
                                    <span className="font-semibold flex-shrink-0">
                                        ${(it.precio * it.cantidad).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tarjetas de selección de modalidad */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                            Método de entrega y pago
                        </h4>

                        {/* Opción Retiro */}
                        <div
                            onClick={() => setTipo("retiro")}
                            className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                                tipo === "retiro"
                                    ? "border-blue-700 bg-blue-50/50"
                                    : "border-zinc-200 bg-white hover:border-zinc-300"
                            }`}
                        >
                            <div className="p-2 bg-blue-100 text-blue-800 rounded-lg mt-0.5">
                                <FaClinicMedical size={16} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-zinc-900">
                                    Retirar y pagar en la clínica
                                </p>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    Apartamos tus productos. Pagas al recogerlos.
                                </p>
                            </div>
                            <input
                                type="radio"
                                name="tipo_pedido"
                                checked={tipo === "retiro"}
                                onChange={() => setTipo("retiro")}
                                className="mt-1 text-blue-700"
                            />
                        </div>

                        {/* Opción En Línea */}
                        <div
                            onClick={() => setTipo("en_linea")}
                            className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                                tipo === "en_linea"
                                    ? "border-blue-700 bg-blue-50/50"
                                    : "border-zinc-200 bg-white hover:border-zinc-300"
                            }`}
                        >
                            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg mt-0.5">
                                <FaCreditCard size={16} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-zinc-900">
                                    Simular pago en línea
                                </p>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    Demostración de checkout; el pedido queda por cobrar al retirarlo.
                                </p>
                            </div>
                            <input
                                type="radio"
                                name="tipo_pedido"
                                checked={tipo === "en_linea"}
                                onChange={() => setTipo("en_linea")}
                                className="mt-1 text-blue-700"
                            />
                        </div>
                    </div>

                    {/* Aviso de modo de prueba al seleccionar pago en línea */}
                    {tipo === "en_linea" && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                            <FaInfoCircle size={16} className="text-amber-600 flex-shrink-0" />
                            <span>
                                <strong>Modo de prueba:</strong> no hay cobro real; pagarás al retirar el pedido en la clínica.
                            </span>
                        </div>
                    )}
                </div>

                {/* Pie con importe y botón de acción */}
                <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between gap-4">
                    <div>
                        <span className="text-xs text-zinc-500 block">Total a liquidar:</span>
                        <span className="text-xl font-extrabold text-blue-950">
                            ${total.toFixed(2)}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleConfirmar}
                        disabled={enviando || items.length === 0}
                        className="py-2.5 px-5 bg-blue-700 hover:bg-blue-800 disabled:bg-zinc-400 text-white text-sm font-bold rounded-xl shadow-md transition"
                    >
                        {enviando
                            ? "Procesando..."
                            : tipo === "en_linea"
                                ? "Pagar (modo de prueba)"
                                : "Confirmar pedido"}
                    </button>
                </div>
            </div>
        </div>
    );
}
