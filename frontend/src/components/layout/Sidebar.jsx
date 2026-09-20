"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar() {
    const pathname = usePathname();

    const opciones = [
        {
            nombre: "Productos",
            ruta: "/productos",
            icono: "📦"
        },
        {
            nombre: "Inventario",
            ruta: "/inventario",
            icono: "📋"
        },
        {
            nombre: "Ventas",
            ruta: "/ventas",
            icono: "💰"
        },
        {
            nombre: "Reportes",
            ruta: "/reportes",
            icono: "📊"
        }
    ];

    return (
        <aside className="w-full bg-slate-900 text-white md:min-h-screen md:w-64">
            <div className="p-6">
                <h1 className="text-2xl font-bold">
                    VetCare
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                    Sistema veterinario
                </p>
            </div>

            <nav className="flex gap-2 overflow-x-auto px-4 pb-4 md:flex-col">
                {opciones.map((opcion) => {
                    const activo = pathname === opcion.ruta;

                    return (
                        <Link
                            key={opcion.ruta}
                            href={opcion.ruta}
                            className={`flex min-w-max items-center gap-3 rounded-lg px-4 py-3 transition ${
                                activo
                                    ? "bg-blue-600 text-white"
                                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            }`}
                        >
                            <span>{opcion.icono}</span>

                            <span className="font-medium">
                                {opcion.nombre}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}