"use client";

import { useEffect, useState } from "react";
import {
    obtenerInventario,
    registrarEntrada,
    registrarSalida
} from "../../../services/inventario.service";
import RequireRole from "../../../components/auth/RequireRole";

function InventarioPage() {
    const [inventario, setInventario] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mensaje, setMensaje] = useState("");

    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [tipoMovimiento, setTipoMovimiento] = useState("");
    const [cantidad, setCantidad] = useState("");

    const cargarInventario = async () => {
        try {
            setCargando(true);
            setError("");

            const respuesta = await obtenerInventario();
            setInventario(respuesta.data.data || []);
        } catch (error) {
            console.error(error);
            setError("No se pudo cargar el inventario.");
        } finally {
            setCargando(false);
        }
    };

    const abrirMovimiento = (producto, tipo) => {
        setProductoSeleccionado(producto);
        setTipoMovimiento(tipo);
        setCantidad("");
        setError("");
        setMensaje("");
    };

    const cerrarMovimiento = () => {
        setProductoSeleccionado(null);
        setTipoMovimiento("");
        setCantidad("");
    };

    const guardarMovimiento = async (e) => {
        e.preventDefault();

        const cantidadNumerica = Number(cantidad);

        if (
            !Number.isInteger(cantidadNumerica) ||
            cantidadNumerica <= 0
        ) {
            setError(
                "La cantidad debe ser un número entero mayor que cero."
            );
            return;
        }

        try {
            setError("");
            setMensaje("");

            const datos = {
                productoId: productoSeleccionado.id,
                cantidad: cantidadNumerica
            };

            if (tipoMovimiento === "entrada") {
                await registrarEntrada(datos);
                setMensaje("Entrada de inventario registrada correctamente.");
            } else {
                await registrarSalida(datos);
                setMensaje("Salida de inventario registrada correctamente.");
            }

            cerrarMovimiento();
            await cargarInventario();
        } catch (error) {
            console.error(error);

            setError(
                error.response?.data?.message ||
                "No se pudo registrar el movimiento."
            );
        }
    };

    useEffect(() => {
        cargarInventario();
    }, []);

    const obtenerEstiloEstado = (estado) => {
        if (estado === "AGOTADO") {
            return "bg-gray-200 text-gray-700";
        }

        if (estado === "STOCK_BAJO") {
            return "bg-red-100 text-red-700";
        }

        return "bg-green-100 text-green-700";
    };

    const obtenerTextoEstado = (estado) => {
        if (estado === "AGOTADO") {
            return "Agotado";
        }

        if (estado === "STOCK_BAJO") {
            return "Stock bajo";
        }

        return "Disponible";
    };

    return (
        <main className="min-h-screen bg-gray-100 p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Inventario
                    </h1>

                    <p className="mt-2 text-gray-600">
                        Control de existencias de VetCare
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

                {productoSeleccionado && (
                    <div className="mb-8 rounded-xl bg-white p-6 shadow">
                        <h2 className="mb-2 text-xl font-bold text-gray-900">
                            {tipoMovimiento === "entrada"
                                ? "Registrar entrada"
                                : "Registrar salida"}
                        </h2>

                        <p className="mb-5 text-gray-600">
                            Producto:{" "}
                            <strong>
                                {productoSeleccionado.nombre}
                            </strong>
                        </p>

                        <p className="mb-5 text-sm text-gray-500">
                            Stock actual: {productoSeleccionado.stock}
                        </p>

                        <form
                            onSubmit={guardarMovimiento}
                            className="flex flex-col gap-4 md:flex-row md:items-end"
                        >
                            <div className="flex-1">
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
                                    required
                                    placeholder="Cantidad"
                                    className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={cerrarMovimiento}
                                className="rounded-lg border border-gray-300 px-5 py-3 text-gray-700 hover:bg-gray-100"
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className={`rounded-lg px-5 py-3 font-semibold text-white ${
                                    tipoMovimiento === "entrada"
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-red-600 hover:bg-red-700"
                                }`}
                            >
                                {tipoMovimiento === "entrada"
                                    ? "Registrar entrada"
                                    : "Registrar salida"}
                            </button>
                        </form>
                    </div>
                )}

                <div className="overflow-hidden rounded-xl bg-white shadow">
                    {cargando ? (
                        <p className="p-6 text-gray-600">
                            Cargando inventario...
                        </p>
                    ) : inventario.length === 0 ? (
                        <p className="p-6 text-gray-600">
                            No hay productos en inventario.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                            Producto
                                        </th>

                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                            Categoría
                                        </th>

                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                            Stock
                                        </th>

                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                            Stock mínimo
                                        </th>

                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                            Estado
                                        </th>

                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                            Movimientos
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-200">
                                    {inventario.map((producto) => (
                                        <tr
                                            key={producto.id}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {producto.nombre}
                                            </td>

                                            <td className="px-6 py-4 text-gray-600">
                                                {producto.categoria}
                                            </td>

                                            <td className="px-6 py-4 font-semibold text-gray-900">
                                                {producto.stock}
                                            </td>

                                            <td className="px-6 py-4 text-gray-600">
                                                {producto.stockMinimo}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${obtenerEstiloEstado(
                                                        producto.estado
                                                    )}`}
                                                >
                                                    {obtenerTextoEstado(
                                                        producto.estado
                                                    )}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            abrirMovimiento(
                                                                producto,
                                                                "entrada"
                                                            )
                                                        }
                                                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                                                    >
                                                        + Entrada
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            abrirMovimiento(
                                                                producto,
                                                                "salida"
                                                            )
                                                        }
                                                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                                    >
                                                        - Salida
                                                    </button>
                                                </div>
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

export default function InventarioPageGuard() {
    return (
        <RequireRole roles={["Administrador", "Recepcionista"]}>
            <InventarioPage />
        </RequireRole>
    );
}