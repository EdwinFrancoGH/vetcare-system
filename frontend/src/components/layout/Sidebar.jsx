"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    FaHome,
    FaDog,
    FaNotesMedical,
    FaSyringe,
    FaUsers,
    FaBoxes,
    FaChartBar,
    FaCalendarAlt,
    FaShoppingCart,
    FaBoxOpen,
    FaUserShield,
    FaSignOutAlt,
    FaTimes,
    FaStore,
    FaClipboardList,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

// "roles": lista de roles que ven ese ítem del menú. Sin "roles", el
// ítem se muestra a cualquier usuario autenticado (ej. Citas, que usan
// tanto el personal como un Cliente, cada uno con su propia vista).
// Esto es solo la interfaz: lo que de verdad impide el acceso a los
// datos es la autorización del backend (ver auth.middleware.js).
const menu = [
    { name: "Dashboard", href: "/dashboard", icon: <FaHome />, roles: ["Administrador", "Recepcionista", "Veterinario", "Cliente"] },
    // Un Cliente también ve "Mascotas": el backend le devuelve solo las suyas.
    { name: "Mascotas", href: "/mascotas", icon: <FaDog />, roles: ["Administrador", "Recepcionista", "Veterinario", "Cliente"] },
    { name: "Historial Clínico", href: "/historial", icon: <FaNotesMedical />, roles: ["Administrador", "Recepcionista", "Veterinario"] },
    { name: "Citas", href: "/citas", icon: <FaCalendarAlt /> },
    { name: "Tienda", href: "/tienda", icon: <FaStore />, roles: ["Cliente"] },
    { name: "Vacunas", href: "/vacunas", icon: <FaSyringe />, roles: ["Administrador", "Recepcionista", "Veterinario"] },
    { name: "Clientes", href: "/clientes", icon: <FaUsers />, roles: ["Administrador", "Recepcionista"] },
    // --- Módulo de ventas, integrado desde la rama auth/ventas ---
    { name: "Productos", href: "/productos", icon: <FaBoxOpen />, roles: ["Administrador", "Recepcionista"] },
    { name: "Inventario", href: "/inventario", icon: <FaBoxes />, roles: ["Administrador", "Recepcionista"] },
    { name: "Ventas", href: "/ventas", icon: <FaShoppingCart />, roles: ["Administrador", "Recepcionista"] },
    { name: "Pedidos", href: "/pedidos", icon: <FaClipboardList />, roles: ["Administrador", "Recepcionista"] },
    { name: "Reportes", href: "/reportes", icon: <FaChartBar />, roles: ["Administrador", "Recepcionista"] },
    { name: "Usuarios", href: "/usuarios", icon: <FaUserShield />, roles: ["Administrador"] },
];

export default function Sidebar({ abierto = false, onCerrar }) {
    const pathname = usePathname();
    const { logout, userRole } = useAuth();
    const menuVisible = menu.filter((item) => !item.roles || item.roles.includes(userRole));

    return (
        <>
            {/* Fondo oscuro para cerrar el menú al hacer clic afuera en móviles */}
            {abierto && (
                <div
                    onClick={onCerrar}
                    className="fixed inset-0 z-40 bg-black/50 md:hidden print:hidden"
                    aria-hidden="true"
                />
            )}

            <aside
                className={`vetcare-sidebar-background fixed inset-y-0 left-0 z-50 w-64 text-white min-h-screen flex flex-col transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:z-auto print:hidden ${
                    abierto ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex items-center justify-between gap-2 border-b border-blue-700 px-4 py-3">
                    <span className="text-3xl font-bold">VetCare</span>
                    <img
                        src="/images/cat-vetcare.png?v=2"
                        alt="Gatito veterinario"
                        width="52"
                        height="72"
                        className="h-[4.5rem] w-[3.25rem] shrink-0 object-contain"
                    />
                    {/* Botón X para cerrar en móviles */}
                    <button
                        type="button"
                        onClick={onCerrar}
                        className="md:hidden text-blue-200 hover:text-white p-1 rounded hover:bg-blue-800 transition"
                        aria-label="Cerrar menú"
                        title="Cerrar menú"
                    >
                        <FaTimes className="text-2xl" />
                    </button>
                </div>

                <nav className="mt-6 flex-1 overflow-y-auto">
                    {menuVisible.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => {
                                    if (onCerrar) onCerrar();
                                }}
                                className={`flex items-center gap-3 px-6 py-4 hover:bg-blue-800 transition ${
                                    isActive ? "bg-blue-800 font-semibold" : ""
                                }`}
                            >
                                {item.icon}
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <button
                    onClick={() => {
                        if (onCerrar) onCerrar();
                        logout();
                    }}
                    className="flex items-center gap-3 px-6 py-4 hover:bg-blue-800 transition border-t border-blue-700 text-left"
                >
                    <FaSignOutAlt />
                    Cerrar Sesión
                </button>
            </aside>
        </>
    );
}
