"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { FaShoppingBag, FaStore, FaExclamationCircle } from "react-icons/fa";
import Swal from "sweetalert2";
import RequireRole from "../../../components/auth/RequireRole";
import { obtenerProductos } from "../../../services/tienda.service";
import { useCarrito } from "../../../hooks/useCarrito";
import FiltrosTienda from "../../../components/tienda/FiltrosTienda";
import ProductoTienda from "../../../components/tienda/ProductoTienda";
import CarritoLateral from "../../../components/tienda/CarritoLateral";
import ModalFinalizarCompra from "../../../components/tienda/ModalFinalizarCompra";

// Catálogo de productos para clientes
export default function TiendaPage() {
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
    const [carritoAbierto, setCarritoAbierto] = useState(false);
    const [modalCompraAbierto, setModalCompraAbierto] = useState(false);

    const {
        items,
        cargado,
        agregar,
        quitar,
        cambiarCantidad,
        vaciar,
        total,
        cantidadTotal,
        sincronizarConCatalogo
    } = useCarrito();

    const notificarSincronizacion = () => {
        Swal.fire({
            toast: true,
            position: "top-end",
            icon: "info",
            title: "Actualizamos tu carrito con los precios y existencias actuales.",
            showConfirmButton: false,
            timer: 3000
        });
    };

    const cargarCatalogo = async () => {
        try {
            setCargando(true);
            setError(null);
            const res = await obtenerProductos();
            const lista = res.data?.data || [];
            setProductos(lista);

            if (sincronizarConCatalogo(lista) > 0) {
                notificarSincronizacion();
            }
        } catch (err) {
            console.error("Error al cargar productos de la tienda:", err);
            setError(err.response?.data?.message || "No se pudieron cargar los productos.");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarCatalogo();
    }, []);

    // Sincronizar cuando el carrito termine de cargarse desde localStorage
    useEffect(() => {
        if (cargado && productos.length > 0) {
            if (sincronizarConCatalogo(productos) > 0) {
                notificarSincronizacion();
            }
        }
    }, [cargado]);

    // Extrae lista única de categorías disponibles
    const categorias = useMemo(() => {
        const setCats = new Set();
        productos.forEach((p) => {
            if (p.categoria?.trim()) setCats.add(p.categoria.trim());
        });
        return Array.from(setCats);
    }, [productos]);

    // Filtra productos según búsqueda y categoría seleccionada
    const productosFiltrados = useMemo(() => {
        return productos.filter((p) => {
            const coincideNombre = p.nombre
                ?.toLowerCase()
                .includes(busqueda.toLowerCase().trim());
            const coincideCat = !categoriaSeleccionada
                || p.categoria?.toLowerCase() === categoriaSeleccionada.toLowerCase();
            return coincideNombre && coincideCat;
        });
    }, [productos, busqueda, categoriaSeleccionada]);

    return (
        <RequireRole roles={["Cliente"]}>
            <div className="space-y-6 pb-20">
                {/* Encabezado con título, subtítulo y enlace a mis pedidos */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <FaStore className="text-blue-700" size={24} />
                            <h1 className="text-2xl font-bold text-zinc-900">Tienda</h1>
                        </div>
                        <p className="text-sm text-zinc-500 mt-1">
                            Compra productos para tu mascota y retíralos en la clínica.
                        </p>
                    </div>

                    <Link
                        href="/tienda/mis-pedidos"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 text-blue-700 hover:bg-blue-50 text-sm font-semibold rounded-xl shadow-sm transition"
                    >
                        <FaShoppingBag size={14} />
                        <span>Mis pedidos</span>
                    </Link>
                </div>

                <FiltrosTienda
                    busqueda={busqueda}
                    onCambiarBusqueda={setBusqueda}
                    categoriaSeleccionada={categoriaSeleccionada}
                    onSeleccionarCategoria={setCategoriaSeleccionada}
                    categorias={categorias}
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
                        <p className="text-sm font-medium">Cargando productos...</p>
                    </div>
                )}

                {!cargando && !error && (
                    productosFiltrados.length === 0 ? (
                        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center text-zinc-400">
                            <FaStore size={44} className="mx-auto mb-3 text-zinc-300" />
                            <p className="text-base font-semibold text-zinc-700">
                                No hay productos disponibles por ahora
                            </p>
                            <p className="text-xs text-zinc-400 mt-1">
                                Intenta con otra búsqueda o regresa más tarde.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {productosFiltrados.map((producto) => (
                                <ProductoTienda
                                    key={producto.id}
                                    producto={producto}
                                    onAgregar={agregar}
                                />
                            ))}
                        </div>
                    )
                )}

                {/* Botón flotante para abrir el carrito */}
                <button
                    type="button"
                    onClick={() => setCarritoAbierto(true)}
                    aria-label={`Abrir carrito con ${cantidadTotal} productos`}
                    title="Ver carrito"
                    className="fixed bottom-6 right-6 z-40 py-3.5 px-5 bg-blue-700 hover:bg-blue-800 text-white rounded-full shadow-2xl flex items-center gap-2.5 transition-transform hover:scale-105"
                >
                    <FaShoppingBag size={18} />
                    <span className="text-sm font-bold">Carrito ({cantidadTotal})</span>
                </button>

                <CarritoLateral
                    abierto={carritoAbierto}
                    onCerrar={() => setCarritoAbierto(false)}
                    items={items}
                    total={total}
                    cantidadTotal={cantidadTotal}
                    onCambiarCantidad={cambiarCantidad}
                    onQuitar={quitar}
                    onVaciar={vaciar}
                    onIniciarCompra={() => {
                        setCarritoAbierto(false);
                        setModalCompraAbierto(true);
                    }}
                />

                <ModalFinalizarCompra
                    abierto={modalCompraAbierto}
                    onCerrar={() => setModalCompraAbierto(false)}
                    items={items}
                    total={total}
                    onVaciarCarrito={vaciar}
                    onRecargarCatalogo={cargarCatalogo}
                />
            </div>
        </RequireRole>
    );
}
