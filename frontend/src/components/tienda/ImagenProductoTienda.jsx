"use client";

import { useState } from "react";
import { FaBaseballBall, FaBone, FaBoxOpen, FaPills, FaPumpSoap, FaTag } from "react-icons/fa";
import { obtenerImagenHttps } from "../../utils/productoTienda";

function iconoCategoria(categoria = "") {
    const normalizada = categoria.toLowerCase();
    if (normalizada.includes("alim") || normalizada.includes("comid")) return <FaBone className="text-amber-600" size={26} aria-hidden="true" />;
    if (normalizada.includes("medic") || normalizada.includes("farm")) return <FaPills className="text-emerald-600" size={26} aria-hidden="true" />;
    if (normalizada.includes("hig") || normalizada.includes("limp")) return <FaPumpSoap className="text-cyan-600" size={26} aria-hidden="true" />;
    if (normalizada.includes("juguet")) return <FaBaseballBall className="text-indigo-600" size={26} aria-hidden="true" />;
    if (normalizada.includes("acces")) return <FaTag className="text-purple-600" size={26} aria-hidden="true" />;
    return <FaBoxOpen className="text-blue-600" size={26} aria-hidden="true" />;
}

export default function ImagenProductoTienda({ producto, className = "" }) {
    const imagen = obtenerImagenHttps(producto.imagenUrl);
    const [imagenFallida, setImagenFallida] = useState(null);

    return (
        <div className={`flex items-center justify-center overflow-hidden bg-zinc-50 ${className}`}>
            {imagen && imagenFallida !== imagen ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={imagen}
                    alt={producto.nombre || "Imagen del producto"}
                    loading="lazy"
                    onError={() => setImagenFallida(imagen)}
                    className="h-full w-full object-cover"
                />
            ) : iconoCategoria(producto.categoria)}
        </div>
    );
}
