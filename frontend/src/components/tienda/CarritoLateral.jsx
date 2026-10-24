"use client";

import { FaTimes, FaTrash, FaPlus, FaMinus, FaShoppingBag } from "react-icons/fa";

// Panel lateral deslizable para revisar y editar el carrito
export default function CarritoLateral({
    abierto,
    onCerrar,
    items = [],
    total = 0,
    cantidadTotal = 0,
    onCambiarCantidad,
    onQuitar,
    onVaciar,
    onIniciarCompra
}) {
    if (!abierto) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop con blur suave */}
            <div
                onClick={onCerrar}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                aria-hidden="true"
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
                <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
                    {/* Encabezado del panel */}
                    <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FaShoppingBag className="text-blue-700" size={18} />
                            <h2 className="text-base font-bold text-zinc-900">Tu Carrito</h2>
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                                {cantidadTotal} {cantidadTotal === 1 ? "artículo" : "artículos"}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={onCerrar}
                            aria-label="Cerrar carrito"
                            title="Cerrar carrito"
                            className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition"
                        >
                            <FaTimes size={16} />
                        </button>
                    </div>

                    {/* Lista de productos en el carrito */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-400 py-12">
                                <FaShoppingBag size={48} className="mb-3 text-zinc-300" />
                                <p className="text-sm font-medium text-zinc-600">
                                    Tu carrito está vacío
                                </p>
                                <p className="text-xs text-zinc-400 mt-1">
                                    Agrega productos desde el catálogo para continuar.
                                </p>
                            </div>
                        ) : (
                            items.map((item) => {
                                const subtotal = (item.precio * item.cantidad).toFixed(2);
                                const maximo = Math.min(item.stock || 20, 20);

                                return (
                                    <div
                                        key={item.productoId}
                                        className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between gap-3"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-zinc-900 truncate">
                                                {item.nombre}
                                            </h4>
                                            <p className="text-xs text-zinc-500">
                                                ${item.precio.toFixed(2)} c/u
                                            </p>
                                            <p className="text-xs font-bold text-blue-900 mt-1">
                                                Subtotal: ${subtotal}
                                            </p>
                                        </div>

                                        {/* Selector de cantidad y botón quitar */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <div className="flex items-center bg-white border border-zinc-200 rounded-lg overflow-hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => onCambiarCantidad(
                                                        item.productoId,
                                                        item.cantidad - 1
                                                    )}
                                                    aria-label="Disminuir unidad"
                                                    title="Disminuir"
                                                    className="p-1.5 text-zinc-600 hover:bg-zinc-100"
                                                >
                                                    <FaMinus size={9} />
                                                </button>
                                                <span className="w-7 text-center text-xs font-semibold text-zinc-800">
                                                    {item.cantidad}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => onCambiarCantidad(
                                                        item.productoId,
                                                        item.cantidad + 1
                                                    )}
                                                    disabled={item.cantidad >= maximo}
                                                    aria-label="Aumentar unidad"
                                                    title="Aumentar"
                                                    className="p-1.5 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30"
                                                >
                                                    <FaPlus size={9} />
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => onQuitar(item.productoId)}
                                                aria-label={`Eliminar ${item.nombre} del carrito`}
                                                title="Eliminar producto"
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                            >
                                                <FaTrash size={12} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Resumen inferior y botón de compra */}
                    {items.length > 0 && (
                        <div className="p-4 border-t border-zinc-200 bg-white space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-500">Total a pagar:</span>
                                <span className="text-xl font-extrabold text-blue-950">
                                    ${total.toFixed(2)}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={onIniciarCompra}
                                className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
                            >
                                <FaShoppingBag size={14} />
                                <span>Finalizar compra</span>
                            </button>

                            <button
                                type="button"
                                onClick={onVaciar}
                                className="w-full py-1.5 text-xs text-zinc-400 hover:text-red-600 transition"
                            >
                                Vaciar carrito
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
