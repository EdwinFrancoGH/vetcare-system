"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import RequireRole from "../../../../../components/auth/RequireRole";
import ImagenProductoTienda from "../../../../../components/tienda/ImagenProductoTienda";
import AgregarProductoCarrito from "../../../../../components/tienda/AgregarProductoCarrito";
import { useCarrito } from "../../../../../hooks/useCarrito";
import { obtenerProductoDetalle } from "../../../../../services/tienda.service";

function DetalleProducto() {
    const params = useParams();
    const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const { agregar, cargado } = useCarrito();
    const [producto, setProducto] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let activa = true;
        Promise.resolve().then(() => obtenerProductoDetalle(id)).then((respuesta) => {
            if (activa) setProducto(respuesta.data?.data || null);
        }).catch((fallo) => {
            if (activa) setError(fallo.response?.data?.message || "No se pudo cargar el producto.");
        }).finally(() => {
            if (activa) setCargando(false);
        });
        return () => { activa = false; };
    }, [id]);

    if (cargando) return <div className="p-8 text-center text-zinc-600">Cargando producto…</div>;

    if (error || !producto) {
        return (
            <section className="mx-auto max-w-3xl p-6 text-center">
                <p className="mb-4 text-zinc-700">{error || "Producto no encontrado."}</p>
                <Link href="/tienda" className="font-semibold text-blue-800 hover:underline">Volver al catálogo</Link>
            </section>
        );
    }

    return (
        <main className="mx-auto max-w-5xl p-4 sm:p-6">
            <Link href="/tienda" className="mb-5 inline-flex text-sm font-medium text-blue-800 hover:underline">← Volver al catálogo</Link>
            <section className="grid overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm md:grid-cols-2">
                <ImagenProductoTienda producto={producto} className="min-h-64 w-full border-b border-zinc-100 md:min-h-96 md:border-b-0 md:border-r" />
                <div className="flex flex-col p-6 sm:p-8">
                    <span className="mb-3 w-fit rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">{producto.categoria || "General"}</span>
                    <h1 className="text-2xl font-bold text-zinc-900">{producto.nombre}</h1>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-600">{producto.descripcion || "Sin descripción disponible."}</p>
                    <div className="mt-6 flex items-baseline justify-between gap-4">
                        <span className="text-2xl font-bold text-blue-900">${(Number(producto.precio) || 0).toFixed(2)}</span>
                        <span className={`text-sm font-semibold ${Number(producto.stock) > 0 ? "text-emerald-700" : "text-amber-700"}`}>
                            {Number(producto.stock) > 0 ? `Disponible · ${producto.stock} en existencia` : "Agotado"}
                        </span>
                    </div>
                    <div className="mt-6">
                        {cargado ? (
                            <AgregarProductoCarrito producto={producto} onAgregar={agregar} detalle />
                        ) : (
                            <p className="text-sm text-zinc-500">Cargando tu carrito…</p>
                        )}
                    </div>
                    <p className="mt-3 text-xs text-zinc-500">El precio y la disponibilidad se vuelven a validar al confirmar el pedido.</p>
                </div>
            </section>
        </main>
    );
}

export default function ProductoDetallePage() {
    return <RequireRole roles={["Cliente"]}><DetalleProducto /></RequireRole>;
}
