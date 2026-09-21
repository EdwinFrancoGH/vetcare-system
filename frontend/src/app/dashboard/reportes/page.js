"use client";

import { useEffect, useState } from "react";
import {
    obtenerResumen,
    obtenerReporteStockBajo,
    obtenerReporteVentas
} from "../../../services/reportes.service";

export default function ReportesPage() {
    const [resumen, setResumen] = useState({
        totalProductos: 0,
        unidadesInventario: 0,
        productosStockBajo: 0,
        totalVentas: 0,
        ingresosTotales: 0
    });

    const [stockBajo, setStockBajo] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const cargarReportes = async () => {
        try {
            setCargando(true);
            setError("");

            const [
                respuestaResumen,
                respuestaStock,
                respuestaVentas
            ] = await Promise.all([
                obtenerResumen(),
                obtenerReporteStockBajo(),
                obtenerReporteVentas()
            ]);

            setResumen(
                respuestaResumen.data.data || {
                    totalProductos: 0,
                    unidadesInventario: 0,
                    productosStockBajo: 0,
                    totalVentas: 0,
                    ingresosTotales: 0
                }
            );

            setStockBajo(respuestaStock.data.data || []);
            setVentas(respuestaVentas.data.data || []);
        } catch (error) {
            console.error(error);
            setError("No se pudieron cargar los reportes.");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarReportes();
    }, []);

    if (cargando) {
        return (
            <main className="min-h-screen bg-gray-100 p-8">
                <div className="mx-auto max-w-7xl">
                    <p className="text-gray-600">
                        Cargando reportes...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-100 p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Reportes
                        </h1>

                        <p className="mt-2 text-gray-600">
                            Resumen general de inventario y ventas
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={cargarReportes}
                        className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                        Actualizar
                    </button>
                </div>

                {error && (
                    <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
                        {error}
                    </div>
                )}

                <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="rounded-xl bg-white p-5 shadow">
                        <p className="text-sm font-semibold text-gray-500">
                            Productos
                        </p>

                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            {resumen.totalProductos}
                        </p>
                    </div>

                    <div className="rounded-xl bg-white p-5 shadow">
                        <p className="text-sm font-semibold text-gray-500">
                            Unidades en inventario
                        </p>

                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            {resumen.unidadesInventario}
                        </p>
                    </div>

                    <div className="rounded-xl bg-white p-5 shadow">
                        <p className="text-sm font-semibold text-gray-500">
                            Stock bajo
                        </p>

                        <p className="mt-2 text-3xl font-bold text-red-600">
                            {resumen.productosStockBajo}
                        </p>
                    </div>

                    <div className="rounded-xl bg-white p-5 shadow">
                        <p className="text-sm font-semibold text-gray-500">
                            Ventas
                        </p>

                        <p className="mt-2 text-3xl font-bold text-gray-900">
                            {resumen.totalVentas}
                        </p>
                    </div>

                    <div className="rounded-xl bg-white p-5 shadow">
                        <p className="text-sm font-semibold text-gray-500">
                            Ingresos
                        </p>

                        <p className="mt-2 text-3xl font-bold text-green-600">
                            $
                            {Number(
                                resumen.ingresosTotales || 0
                            ).toFixed(2)}
                        </p>
                    </div>
                </div>

                <div className="mb-8 overflow-hidden rounded-xl bg-white shadow">
                    <div className="border-b border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900">
                            Productos con stock bajo
                        </h2>
                    </div>

                    {stockBajo.length === 0 ? (
                        <div className="p-6">
                            <p className="font-medium text-green-700">
                                No hay productos con stock bajo.
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                Todos los productos se encuentran por
                                encima de su stock mínimo.
                            </p>
                        </div>
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
                                            Stock actual
                                        </th>

                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                            Stock mínimo
                                        </th>

                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                            Estado
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-200">
                                    {stockBajo.map((producto) => (
                                        <tr key={producto.id}>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {producto.nombre}
                                            </td>

                                            <td className="px-6 py-4 text-gray-600">
                                                {producto.categoria}
                                            </td>

                                            <td className="px-6 py-4 font-semibold text-red-600">
                                                {producto.stock}
                                            </td>

                                            <td className="px-6 py-4 text-gray-600">
                                                {producto.stockMinimo}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                                    {Number(
                                                        producto.stock
                                                    ) === 0
                                                        ? "Agotado"
                                                        : "Stock bajo"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="overflow-hidden rounded-xl bg-white shadow">
                    <div className="border-b border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900">
                            Reporte de ventas
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
                                            Método de pago
                                        </th>

                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                            Total
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-200">
                                    {ventas.map((venta) => (
                                        <tr
                                            key={venta.id}
                                            className="hover:bg-gray-50"
                                        >
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