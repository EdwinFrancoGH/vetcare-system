"use client";

import Link from "next/link";
import ImagenProductoTienda from "./ImagenProductoTienda";
import AgregarProductoCarrito from "./AgregarProductoCarrito";

// Tarjeta individual de producto en el catálogo
export default function ProductoTienda({ producto, onAgregar }) {
    const stock = Number(producto.stock) || 0;
    const precioFormateado = `$${(Number(producto.precio) || 0).toFixed(2)}`;

    return (
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                    <ImagenProductoTienda producto={producto} className="w-12 h-12 rounded-xl border border-zinc-100 flex-shrink-0" />
                    <span className="text-[11px] font-medium text-zinc-600 bg-zinc-100 px-2.5 py-0.5 rounded-full">
                        {producto.categoria || "General"}
                    </span>
                </div>

                <Link href={`/tienda/productos/${encodeURIComponent(producto.id)}`} className="block font-semibold text-zinc-900 text-base line-clamp-1 mb-1 hover:text-blue-800" title={producto.nombre}>
                    {producto.nombre}
                </Link>
                {producto.descripcion ? (
                    <p className="text-xs text-zinc-500 line-clamp-2 mb-3" title={producto.descripcion}>
                        {producto.descripcion}
                    </p>
                ) : (
                    <div className="h-4 mb-3" />
                )}
            </div>

            <div className="pt-2 border-t border-zinc-100">
                <div className="flex items-baseline justify-between mb-3">
                    <span className="text-lg font-bold text-blue-900">{precioFormateado}</span>
                    {stock <= 5 && stock > 0 && (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Quedan {stock}
                        </span>
                    )}
                </div>
                <AgregarProductoCarrito producto={producto} onAgregar={onAgregar} />
            </div>
        </div>
    );
}
