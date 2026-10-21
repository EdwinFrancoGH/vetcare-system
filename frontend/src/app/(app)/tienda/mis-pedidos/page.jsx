"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FaArrowLeft, FaShoppingBag, FaStore, FaExclamationCircle } from "react-icons/fa";
import Swal from "sweetalert2";
import RequireRole from "../../../../components/auth/RequireRole";
import { obtenerMisPedidos, cancelarMiPedido } from "../../../../services/tienda.service";
import TarjetaPedido from "../../../../components/tienda/TarjetaPedido";

// Vista de pedidos realizados por el cliente autenticado
export default function MisPedidosPage() {
    const [pedidos, setPedidos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [cancelandoId, setCancelandoId] = useState(null);

    const cargarPedidos = async () => {
        try {
            setCargando(true);
            setError(null);
            const res = await obtenerMisPedidos();
            setPedidos(res.data?.data || []);
        } catch (err) {
            console.error("Error al obtener mis pedidos:", err);
            setError(err.response?.data?.message || "No se pudieron cargar tus pedidos.");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarPedidos();
    }, []);

    const handleCancelar = async (pedido) => {
        const idCorto = (pedido.id || "").slice(0, 6).toUpperCase();

        const confirmacion = await Swal.fire({
            title: "¿Cancelar pedido?",
            text: `¿Estás seguro de cancelar el pedido #${idCorto}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, cancelar",
            cancelButtonText: "Volver"
        });

        if (!confirmacion.isConfirmed) return;

        try {
            setCancelandoId(pedido.id);
            await cancelarMiPedido(pedido.id);
            await Swal.fire({
                title: "Pedido cancelado",
                text: "El pedido fue cancelado y las existencias se devolvieron a la clínica.",
                icon: "success",
                confirmButtonColor: "#1d4ed8"
            });
            await cargarPedidos();
        } catch (err) {
            console.error("Error al cancelar pedido:", err);
            Swal.fire({
                title: "Error al cancelar",
                text: err.response?.data?.message || "No se pudo cancelar el pedido.",
                icon: "error",
                confirmButtonColor: "#1d4ed8"
            });
        } finally {
            setCancelandoId(null);
        }
    };

    return (
        <RequireRole roles={["Cliente"]}>
            <div className="space-y-6 pb-16">
                {/* Encabezado con enlace para volver y título */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <Link
                            href="/tienda"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 mb-2 transition"
                        >
                            <FaArrowLeft size={11} />
                            <span>Volver a la tienda</span>
                        </Link>
                        <div className="flex items-center gap-2">
                            <FaShoppingBag className="text-blue-700" size={22} />
                            <h1 className="text-2xl font-bold text-zinc-900">Mis Pedidos</h1>
                        </div>
                        <p className="text-sm text-zinc-500 mt-0.5">
                            Revisa el estado de tus compras y retiros pendientes.
                        </p>
                    </div>

                    <Link
                        href="/tienda"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition self-start sm:self-auto"
                    >
                        <FaStore size={13} />
                        <span>Ir al catálogo</span>
                    </Link>
                </div>

                {/* Estado de error */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
                        <FaExclamationCircle size={18} className="flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Estado de carga */}
                {cargando && (
                    <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-sm font-medium">Cargando tus pedidos...</p>
                    </div>
                )}

                {/* Lista de pedidos o estado vacío */}
                {!cargando && !error && (
                    pedidos.length === 0 ? (
                        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center text-zinc-400 space-y-3">
                            <FaShoppingBag size={44} className="mx-auto text-zinc-300" />
                            <p className="text-base font-semibold text-zinc-700">
                                No tienes pedidos registrados todavía
                            </p>
                            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                                Cuando realices una compra en la tienda podrás consultar aquí su estado y detalles.
                            </p>
                            <div className="pt-2">
                                <Link
                                    href="/tienda"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
                                >
                                    <FaStore size={13} />
                                    <span>Ir a la tienda</span>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pedidos.map((pedido) => (
                                <TarjetaPedido
                                    key={pedido.id}
                                    pedido={pedido}
                                    onCancelar={handleCancelar}
                                    cancelando={cancelandoId === pedido.id}
                                />
                            ))}
                        </div>
                    )
                )}
            </div>
        </RequireRole>
    );
}
