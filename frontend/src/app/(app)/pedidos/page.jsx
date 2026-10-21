"use client";

import { useState, useEffect, useMemo } from "react";
import { FaClipboardList, FaExclamationCircle, FaBoxOpen } from "react-icons/fa";
import Swal from "sweetalert2";
import RequireRole from "../../../components/auth/RequireRole";
import {
    obtenerPedidos,
    cambiarEstadoPedido,
    extenderPlazoPedido
} from "../../../services/pedidos.service";
import { obtenerTextoNuevaFechaLimite } from "../../../utils/extensionPlazo";
import FiltrosPedidos from "../../../components/pedidos/FiltrosPedidos";
import TarjetaPedidoPersonal from "../../../components/pedidos/TarjetaPedidoPersonal";


// Gestión y despacho de pedidos para el personal administrativo y recepción
export default function PedidosPage() {
    const [pedidos, setPedidos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [actualizando, setActualizando] = useState(false);
    const [error, setError] = useState(null);
    const [pestanaActiva, setPestanaActiva] = useState("pendiente");
    const [busqueda, setBusqueda] = useState("");
    const [procesandoId, setProcesandoId] = useState(null);

    const cargarLista = async (esRecarga = false) => {
        try {
            if (esRecarga) setActualizando(true);
            else setCargando(true);
            setError(null);
            const res = await obtenerPedidos();
            setPedidos(res.data?.data || []);
        } catch (err) {
            console.error("Error al cargar pedidos:", err);
            setError(err.response?.data?.message || "No se pudieron cargar los pedidos.");
        } finally {
            setCargando(false);
            setActualizando(false);
        }
    };

    useEffect(() => {
        cargarLista(false);
    }, []);

    const conteos = useMemo(() => {
        const c = { pendiente: 0, listo: 0, entregado: 0, cancelado: 0, todos: pedidos.length };
        pedidos.forEach((p) => {
            if (c[p.estado] !== undefined) c[p.estado]++;
        });
        return c;
    }, [pedidos]);

    const pedidosFiltrados = useMemo(() => {
        return pedidos.filter((p) => {
            if (pestanaActiva !== "todos" && p.estado !== pestanaActiva) return false;
            if (!busqueda.trim()) return true;
            const q = busqueda.trim().toLowerCase();
            const idCorto = (p.id || "").slice(0, 6).toLowerCase();
            const cliente = (p.clienteNombre || "").toLowerCase();
            return idCorto.includes(q) || cliente.includes(q);
        });
    }, [pedidos, pestanaActiva, busqueda]);

    const handleMarcarListo = async (pedido) => {
        const idCorto = (pedido.id || "").slice(0, 6).toUpperCase();
        const conf = await Swal.fire({
            title: "¿Marcar como listo?",
            text: `El pedido #${idCorto} de ${pedido.clienteNombre} estará listo para entrega.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#1d4ed8",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, marcar listo",
            cancelButtonText: "Volver"
        });
        if (!conf.isConfirmed) return;

        try {
            setProcesandoId(pedido.id);
            await cambiarEstadoPedido(pedido.id, "listo");
            await Swal.fire("¡Listo!", "El pedido ahora está marcado para retiro.", "success");
            await cargarLista(true);
        } catch (err) {
            await Swal.fire("Error", err.response?.data?.message || "No se pudo actualizar.", "error");
            await cargarLista(true);
        } finally {
            setProcesandoId(null);
        }
    };

    const handleCancelar = async (pedido) => {
        const conf = await Swal.fire({
            title: "¿Cancelar pedido?",
            text: "Los productos volverán al inventario.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, cancelar",
            cancelButtonText: "Volver"
        });
        if (!conf.isConfirmed) return;

        try {
            setProcesandoId(pedido.id);
            await cambiarEstadoPedido(pedido.id, "cancelado");
            await Swal.fire("Cancelado", "El pedido fue cancelado y se repuso el stock.", "success");
            await cargarLista(true);
        } catch (err) {
            await Swal.fire("Error", err.response?.data?.message || "No se pudo cancelar.", "error");
            await cargarLista(true);
        } finally {
            setProcesandoId(null);
        }
    };

    const handleEntregar = async (pedido) => {
        const idCorto = (pedido.id || "").slice(0, 6).toUpperCase();
        let metodoPago = pedido.metodoPago || "Efectivo";

        if (!pedido.pagado) {
            const { value, isConfirmed } = await Swal.fire({
                title: "Entregar pedido",
                text: `Selecciona el método de pago utilizado por el cliente (#${idCorto}):`,
                input: "select",
                inputOptions: { Efectivo: "Efectivo", Tarjeta: "Tarjeta", Transferencia: "Transferencia" },
                inputValue: "Efectivo",
                showCancelButton: true,
                confirmButtonColor: "#059669",
                cancelButtonColor: "#6b7280",
                confirmButtonText: "Registrar entrega",
                cancelButtonText: "Cancelar"
            });
            if (!isConfirmed || !value) return;
            metodoPago = value;
        } else {
            const conf = await Swal.fire({
                title: "¿Confirmar entrega?",
                text: `¿Entregar el pedido #${idCorto}? Ya fue pagado en línea.`,
                icon: "question",
                showCancelButton: true,
                confirmButtonColor: "#059669",
                cancelButtonColor: "#6b7280",
                confirmButtonText: "Sí, entregar",
                cancelButtonText: "Cancelar"
            });
            if (!conf.isConfirmed) return;
        }

        try {
            setProcesandoId(pedido.id);
            const res = await cambiarEstadoPedido(pedido.id, "entregado", metodoPago);
            const { facturaEnviada } = res.data || {};
            let texto = `El pedido #${idCorto} fue entregado y la venta quedó registrada.`;
            if (facturaEnviada === false) texto += " La factura no se pudo enviar por correo.";
            await Swal.fire("¡Pedido entregado!", texto, "success");
            await cargarLista(true);
        } catch (err) {
            await Swal.fire("Error", err.response?.data?.message || "No se pudo registrar.", "error");
            await cargarLista(true);
        } finally {
            setProcesandoId(null);
        }
    };

    const handleExtenderPlazo = async (pedido) => {
        const fechaFormateada = obtenerTextoNuevaFechaLimite(pedido);
        const conf = await Swal.fire({
            title: "¿Dar más tiempo?",
            text:
                `¿Dar 2 días más para retirar el pedido de ` +
                `${pedido.clienteNombre || "Cliente"}? Nuevo plazo: ${fechaFormateada}`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#1d4ed8",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Sí, dar más tiempo",
            cancelButtonText: "Volver"
        });
        if (!conf.isConfirmed) return;

        try {
            setProcesandoId(pedido.id);
            await extenderPlazoPedido(pedido.id);
            await Swal.fire("¡Listo!", "Plazo del pedido extendido correctamente.", "success");
            await cargarLista(true);
        } catch (err) {
            await Swal.fire(
                "Error",
                err.response?.data?.message || "No se pudo extender el plazo.",
                "error"
            );
            await cargarLista(true);
        } finally {
            setProcesandoId(null);
        }
    };

    const textoVacio = pestanaActiva === "todos"
        ? "No hay pedidos registrados."
        : `No hay pedidos ${pestanaActiva === "listo" ? "listos para retirar" : pestanaActiva + "s"}.`;

    return (
        <RequireRole roles={["Administrador", "Recepcionista"]}>
            <div className="space-y-6 pb-16">
                <div>
                    <div className="flex items-center gap-2">
                        <FaClipboardList className="text-blue-700" size={24} />
                        <h1 className="text-2xl font-bold text-zinc-900">Pedidos de la tienda</h1>
                    </div>
                    <p className="text-sm text-zinc-500 mt-1">
                        Prepara y entrega los pedidos que hacen los clientes desde la app.
                    </p>
                </div>

                <FiltrosPedidos
                    pestanaActiva={pestanaActiva}
                    onCambiarPestana={setPestanaActiva}
                    busqueda={busqueda}
                    onCambiarBusqueda={setBusqueda}
                    conteos={conteos}
                    cargando={actualizando}
                    onRecargar={() => cargarLista(true)}
                />

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 text-sm">
                        <FaExclamationCircle size={18} className="flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {cargando && (
                    <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-sm font-medium">Cargando pedidos...</p>
                    </div>
                )}

                {!cargando && !error && (
                    pedidosFiltrados.length === 0 ? (
                        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center text-zinc-400">
                            <FaBoxOpen size={44} className="mx-auto mb-3 text-zinc-300" />
                            <p className="text-base font-semibold text-zinc-700">
                                {busqueda.trim() ? "No se encontraron coincidencias" : textoVacio}
                            </p>
                            <p className="text-xs text-zinc-400 mt-1">
                                {busqueda.trim() ? "Prueba con otro término." : "Los pedidos aparecerán aquí."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pedidosFiltrados.map((pedido) => (
                                <TarjetaPedidoPersonal
                                    key={pedido.id}
                                    pedido={pedido}
                                    onMarcarListo={handleMarcarListo}
                                    onEntregar={handleEntregar}
                                    onCancelar={handleCancelar}
                                    onExtender={handleExtenderPlazo}
                                    procesando={procesandoId === pedido.id}
                                />
                            ))}
                        </div>
                    )
                )}
            </div>
        </RequireRole>
    );
}

