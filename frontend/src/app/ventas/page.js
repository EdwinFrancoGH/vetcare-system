"use client";

import { useEffect, useMemo, useState } from "react";
import { obtenerProductos } from "../../services/productos.service";
import {
    obtenerVentas,
    registrarVenta
} from "../../services/ventas.service";

export default function VentasPage() {
    const [productos, setProductos] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [carrito, setCarrito] = useState([]);

    const [productoId, setProductoId] = useState("");
    const [cantidad, setCantidad] = useState(1);
    const [cliente, setCliente] = useState("");
    const [metodoPago, setMetodoPago] = useState("Efectivo");

    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError("");

            const [respuestaProductos, respuestaVentas] =
                await Promise.all([
                    obtenerProductos(),
                    obtenerVentas()
                ]);

            setProductos(respuestaProductos.data.data || []);
            setVentas(respuestaVentas.data.data || []);
        } catch (error) {
            console.error(error);
            setError("No se pudieron cargar los datos de ventas.");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const agregarProducto = () => {
        setError("");
        setMensaje("");

        if (!productoId) {
            setError("Selecciona un producto.");
            return;
        }

        const cantidadNumerica = Number(cantidad);

        if (
            !Number.isInteger(cantidadNumerica) ||
            cantidadNumerica <= 0
        ) {
            setError("La cantidad debe ser mayor que cero.");
            return;
        }

        const producto = productos.find(
            (item) => item.id === productoId
        );

        if (!producto) {
            setError("El producto seleccionado no existe.");
            return;
        }

        const productoEnCarrito = carrito.find(
            (item) => item.productoId === producto.id
        );

        const cantidadActual =
            productoEnCarrito?.cantidad || 0;

        const nuevaCantidad =
            cantidadActual + cantidadNumerica;

        if (nuevaCantidad > Number(producto.stock)) {
            setError(
                `Stock insuficiente. Disponible: ${producto.stock}`
            );
            return;
        }

        if (productoEnCarrito) {
            setCarrito(
                carrito.map((item) =>
                    item.productoId === producto.id
                        ? {
                              ...item,
                              cantidad: nuevaCantidad
                          }
                        : item
                )
            );
        } else {
            setCarrito([
                ...carrito,
                {
                    productoId: producto.id,
                    nombre: producto.nombre,
                    precio: Number(producto.precio),
                    cantidad: cantidadNumerica,
                    stock: Number(producto.stock)
                }
            ]);
        }

        setProductoId("");
        setCantidad(1);
    };

    const eliminarDelCarrito = (productoId) => {
        setCarrito(
            carrito.filter(
                (item) => item.productoId !== productoId
            )
        );
    };

    const total = useMemo(() => {
        return carrito.reduce(
            (acumulado, item) =>
                acumulado +
                Number(item.precio) * Number(item.cantidad),
            0
        );
    }, [carrito]);

    const guardarVenta = async () => {
        if (carrito.length === 0) {
            setError(
                "Debes agregar al menos un producto a la venta."
            );
            return;
        }

        try {
            setGuardando(true);
            setError("");
            setMensaje("");

            await registrarVenta({
                cliente: cliente.trim(),
                metodoPago,
                productos: carrito.map((item) => ({
                    productoId: item.productoId,
                    cantidad: item.cantidad
                }))
            });

            setCarrito([]);
            setCliente("");
            setMetodoPago("Efectivo");

            setMensaje("Venta registrada correctamente.");

            await cargarDatos();
        } catch (error) {
            console.error(error);

            setError(
                error.response?.data?.message ||
                    "No se pudo registrar la venta."
            );
        } finally {
            setGuardando(false);
        }
    };

    if (cargando) {
        return (
            <main className="min-h-screen bg-gray-100 p-8">
                <div className="mx-auto max-w-7xl">
                    <p className="text-gray-600">
                        Cargando ventas...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-100 p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Ventas
                    </h1>

                    <p className="mt-2 text-gray-600">
                        Registro y control de ventas de VetCare
                    </p>
                </div>

                {mensaje && (
                    <div className="mb-6 rounded-lg bg-green-100 p-4 text-green-700">
                        {mensaje}
                    </div>
                )}

                {error && (
                    <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
                        {error}
                    </div>
                )}

                <div className="mb-8 rounded-xl bg-white p-6 shadow">
                    <h2 className="mb-6 text-xl font-bold text-gray-900">
                        Nueva venta
                    </h2>

                    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Cliente
                            </label>

                            <input
                                type="text"
                                value={cliente}
                                onChange={(e) =>
                                    setCliente(e.target.value)
                                }
                                placeholder="Nombre del cliente (opcional)"
                                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Método de pago
                            </label>

                            <select
                                value={metodoPago}
                                onChange={(e) =>
                                    setMetodoPago(e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                            >
                                <option value="Efectivo">
                                    Efectivo
                                </option>
                                <option value="Tarjeta">
                                    Tarjeta
                                </option>
                                <option value="Transferencia">
                                    Transferencia
                                </option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_150px_auto]">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Producto
                            </label>

                            <select
                                value={productoId}
                                onChange={(e) =>
                                    setProductoId(e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                            >
                                <option value="">
                                    Selecciona un producto
                                </option>

                                {productos
                                    .filter(
                                        (producto) =>
                                            Number(producto.stock) > 0
                                    )
                                    .map((producto) => (
                                        <option
                                            key={producto.id}
                                            value={producto.id}
                                        >
                                            {producto.nombre} - Stock:{" "}
                                            {producto.stock} - $
                                            {Number(
                                                producto.precio
                                            ).toFixed(2)}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Cantidad
                            </label>

                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={cantidad}
                                onChange={(e) =>
                                    setCantidad(e.target.value)
                                }
                                className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={agregarProducto}
                            className="self-end rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                        >
                            + Agregar
                        </button>
                    </div>

                    <div className="mt-8 overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        Producto
                                    </th>

                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        Precio
                                    </th>

                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        Cantidad
                                    </th>

                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        Subtotal
                                    </th>

                                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                        Acción
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                                {carrito.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="px-4 py-6 text-center text-gray-500"
                                        >
                                            No hay productos agregados.
                                        </td>
                                    </tr>
                                ) : (
                                    carrito.map((item) => (
                                        <tr key={item.productoId}>
                                            <td className="px-4 py-4 text-gray-900">
                                                {item.nombre}
                                            </td>

                                            <td className="px-4 py-4 text-gray-700">
                                                $
                                                {Number(
                                                    item.precio
                                                ).toFixed(2)}
                                            </td>

                                            <td className="px-4 py-4 text-gray-700">
                                                {item.cantidad}
                                            </td>

                                            <td className="px-4 py-4 font-semibold text-gray-900">
                                                $
                                                {(
                                                    Number(item.precio) *
                                                    Number(item.cantidad)
                                                ).toFixed(2)}
                                            </td>

                                            <td className="px-4 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        eliminarDelCarrito(
                                                            item.productoId
                                                        )
                                                    }
                                                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                                >
                                                    Quitar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex flex-col items-end gap-4">
                        <div className="text-2xl font-bold text-gray-900">
                            Total: ${total.toFixed(2)}
                        </div>

                        <button
                            type="button"
                            onClick={guardarVenta}
                            disabled={
                                guardando || carrito.length === 0
                            }
                            className="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {guardando
                                ? "Registrando..."
                                : "Registrar venta"}
                        </button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl bg-white shadow">
                    <div className="border-b border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900">
                            Historial de ventas
                        </h2>
                    </div>

                    {ventas.length === 0 ? (
                        <p className="p-6 text-gray-600">
                            No hay ventas registradas.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                            Fecha
                                        </th>

                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                            Cliente
                                        </th>

                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                            Productos
                                        </th>

                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                            Pago
                                        </th>

                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                            Total
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-200">
                                    {ventas.map((venta) => (
                                        <tr key={venta.id}>
                                            <td className="px-6 py-4 text-gray-600">
                                                {venta.fechaVenta
                                                    ? new Date(
                                                          venta.fechaVenta
                                                      ).toLocaleString()
                                                    : "-"}
                                            </td>

                                            <td className="px-6 py-4 text-gray-900">
                                                {venta.cliente ||
                                                    "Consumidor final"}
                                            </td>

                                            <td className="px-6 py-4 text-gray-600">
                                                {venta.productos
                                                    ?.map(
                                                        (producto) =>
                                                            `${producto.nombre} x${producto.cantidad}`
                                                    )
                                                    .join(", ") || "-"}
                                            </td>

                                            <td className="px-6 py-4 text-gray-600">
                                                {venta.metodoPago}
                                            </td>

                                            <td className="px-6 py-4 font-semibold text-gray-900">
                                                $
                                                {Number(
                                                    venta.total || 0
                                                ).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}