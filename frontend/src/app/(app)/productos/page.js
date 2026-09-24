"use client";

import { useEffect, useState } from "react";
import {
    obtenerProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto
} from "../../../services/productos.service";
import RequireRole from "../../../components/auth/RequireRole";

function ProductosPage() {
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [productoEditando, setProductoEditando] = useState(null);

    const formularioVacio = {
        nombre: "",
        categoria: "",
        descripcion: "",
        precio: "",
        stock: "",
        stockMinimo: "",
        fechaVencimiento: ""
    };

    const [formulario, setFormulario] = useState(formularioVacio);

    const cargarProductos = async () => {
        try {
            setCargando(true);
            setError("");

            const respuesta = await obtenerProductos();
            setProductos(respuesta.data.data || []);
        } catch (error) {
            console.error(error);
            setError("No se pudieron cargar los productos.");
        } finally {
            setCargando(false);
        }
    };

    const manejarCambio = (e) => {
        const { name, value } = e.target;

        setFormulario({
            ...formulario,
            [name]: value
        });
    };

    const abrirNuevoProducto = () => {
        setProductoEditando(null);
        setFormulario(formularioVacio);
        setError("");
        setMostrarFormulario(true);
    };

    const editarProducto = (producto) => {
        setProductoEditando(producto);

        setFormulario({
            nombre: producto.nombre || "",
            categoria: producto.categoria || "",
            descripcion: producto.descripcion || "",
            precio: producto.precio ?? "",
            stock: producto.stock ?? "",
            stockMinimo: producto.stockMinimo ?? "",
            fechaVencimiento: producto.fechaVencimiento || ""
        });

        setError("");
        setMostrarFormulario(true);
    };

    const cerrarFormulario = () => {
        setMostrarFormulario(false);
        setProductoEditando(null);
        setFormulario(formularioVacio);
        setError("");
    };

    const guardarProducto = async (e) => {
        e.preventDefault();

        try {
            setError("");

            if (productoEditando) {
                await actualizarProducto(
                    productoEditando.id,
                    formulario
                );
            } else {
                await crearProducto(formulario);
            }

            setFormulario(formularioVacio);
            setProductoEditando(null);
            setMostrarFormulario(false);

            await cargarProductos();
        } catch (error) {
            console.error(error);

            setError(
                error.response?.data?.message ||
                "No se pudo guardar el producto."
            );
        }
    };

    const borrarProducto = async (producto) => {
        const confirmar = window.confirm(
            `¿Seguro que deseas eliminar "${producto.nombre}"?`
        );

        if (!confirmar) {
            return;
        }

        try {
            setError("");

            await eliminarProducto(producto.id);
            await cargarProductos();
        } catch (error) {
            console.error(error);

            setError(
                error.response?.data?.message ||
                "No se pudo eliminar el producto."
            );
        }
    };

    useEffect(() => {
        cargarProductos();
    }, []);

    return (
        <main className="min-h-screen bg-gray-100 p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Productos
                        </h1>

                        <p className="mt-2 text-gray-600">
                            Gestión de productos de VetCare
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={abrirNuevoProducto}
                        className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                    >
                        + Nuevo producto
                    </button>
                </div>

                {mostrarFormulario && (
                    <div className="mb-8 rounded-xl bg-white p-6 shadow">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">
                                {productoEditando
                                    ? "Editar producto"
                                    : "Nuevo producto"}
                            </h2>

                            <button
                                type="button"
                                onClick={cerrarFormulario}
                                className="text-gray-500 hover:text-gray-800"
                            >
                                ✕
                            </button>
                        </div>

                        <form
                            onSubmit={guardarProducto}
                            className="grid grid-cols-1 gap-4 md:grid-cols-2"
                        >
                            <input
                                type="text"
                                name="nombre"
                                placeholder="Nombre del producto"
                                value={formulario.nombre}
                                onChange={manejarCambio}
                                required
                                className="rounded-lg border border-gray-300 p-3 text-gray-900"
                            />

                            <input
                                type="text"
                                name="categoria"
                                placeholder="Categoría"
                                value={formulario.categoria}
                                onChange={manejarCambio}
                                required
                                className="rounded-lg border border-gray-300 p-3 text-gray-900"
                            />

                            <input
                                type="number"
                                name="precio"
                                placeholder="Precio"
                                min="0"
                                step="0.01"
                                value={formulario.precio}
                                onChange={manejarCambio}
                                required
                                className="rounded-lg border border-gray-300 p-3 text-gray-900"
                            />

                            <input
                                type="number"
                                name="stock"
                                placeholder="Stock"
                                min="0"
                                step="1"
                                value={formulario.stock}
                                onChange={manejarCambio}
                                required
                                className="rounded-lg border border-gray-300 p-3 text-gray-900"
                            />

                            <input
                                type="number"
                                name="stockMinimo"
                                placeholder="Stock mínimo"
                                min="0"
                                step="1"
                                value={formulario.stockMinimo}
                                onChange={manejarCambio}
                                required
                                className="rounded-lg border border-gray-300 p-3 text-gray-900"
                            />

                            <input
                                type="date"
                                name="fechaVencimiento"
                                value={formulario.fechaVencimiento}
                                onChange={manejarCambio}
                                className="rounded-lg border border-gray-300 p-3 text-gray-900"
                            />

                            <textarea
                                name="descripcion"
                                placeholder="Descripción"
                                value={formulario.descripcion}
                                onChange={manejarCambio}
                                rows="3"
                                className="rounded-lg border border-gray-300 p-3 text-gray-900 md:col-span-2"
                            />

                            <div className="flex justify-end gap-3 md:col-span-2">
                                <button
                                    type="button"
                                    onClick={cerrarFormulario}
                                    className="rounded-lg border border-gray-300 px-5 py-2 text-gray-700 hover:bg-gray-100"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
                                >
                                    {productoEditando
                                        ? "Guardar cambios"
                                        : "Guardar producto"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {error && (
                    <div className="mb-6 rounded-lg bg-red-100 p-4 text-red-700">
                        {error}
                    </div>
                )}

                <div className="overflow-hidden rounded-xl bg-white shadow">
                    {cargando ? (
                        <p className="p-6 text-gray-600">
                            Cargando productos...
                        </p>
                    ) : productos.length === 0 ? (
                        <p className="p-6 text-gray-600">
                            No hay productos registrados.
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
                                            Precio
                                        </th>

                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                            Stock
                                        </th>

                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                            Estado
                                        </th>

                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-200">
                                    {productos.map((producto) => {
                                        const stock = Number(producto.stock);
                                        const stockMinimo = Number(
                                            producto.stockMinimo
                                        );

                                        const agotado = stock === 0;
                                        const stockBajo =
                                            stock > 0 &&
                                            stock <= stockMinimo;

                                        return (
                                            <tr
                                                key={producto.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-6 py-4 text-gray-900">
                                                    {producto.nombre}
                                                </td>

                                                <td className="px-6 py-4 text-gray-600">
                                                    {producto.categoria}
                                                </td>

                                                <td className="px-6 py-4 text-gray-900">
                                                    $
                                                    {Number(
                                                        producto.precio
                                                    ).toFixed(2)}
                                                </td>

                                                <td className="px-6 py-4 text-gray-900">
                                                    {producto.stock}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                            agotado
                                                                ? "bg-gray-200 text-gray-700"
                                                                : stockBajo
                                                                  ? "bg-red-100 text-red-700"
                                                                  : "bg-green-100 text-green-700"
                                                        }`}
                                                    >
                                                        {agotado
                                                            ? "Agotado"
                                                            : stockBajo
                                                              ? "Stock bajo"
                                                              : "Disponible"}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                editarProducto(
                                                                    producto
                                                                )
                                                            }
                                                            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                                                        >
                                                            Editar
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                borrarProducto(
                                                                    producto
                                                                )
                                                            }
                                                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

export default function ProductosPageGuard() {
    return (
        <RequireRole roles={["Administrador", "Recepcionista"]}>
            <ProductosPage />
        </RequireRole>
    );
}