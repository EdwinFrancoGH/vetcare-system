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
    { name: "Vacunas", href: "/vacunas", icon: <FaSyringe />, roles: ["Administrador", "Recepcionista", "Veterinario"] },
    { name: "Clientes", href: "/clientes", icon: <FaUsers />, roles: ["Administrador", "Recepcionista"] },
    // --- Módulo de ventas, integrado desde la rama auth/ventas ---
    { name: "Productos", href: "/productos", icon: <FaBoxOpen />, roles: ["Administrador", "Recepcionista"] },
    { name: "Inventario", href: "/inventario", icon: <FaBoxes />, roles: ["Administrador", "Recepcionista"] },
    { name: "Ventas", href: "/ventas", icon: <FaShoppingCart />, roles: ["Administrador", "Recepcionista"] },
    { name: "Reportes", href: "/reportes", icon: <FaChartBar />, roles: ["Administrador", "Recepcionista"] },
    { name: "Usuarios", href: "/usuarios", icon: <FaUserShield />, roles: ["Administrador"] },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { logout, userRole } = useAuth();
    const menuVisible = menu.filter((item) => !item.roles || item.roles.includes(userRole));

    return (
        <aside className="w-64 bg-blue-900 text-white min-h-screen flex flex-col">
            <div className="text-3xl font-bold p-6 border-b border-blue-700">
                VetCare
            </div>

            <nav className="mt-6 flex-1 overflow-y-auto">
                {menuVisible.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
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
                onClick={logout}
                className="flex items-center gap-3 px-6 py-4 hover:bg-blue-800 transition border-t border-blue-700 text-left"
            >
                <FaSignOutAlt />
                Cerrar Sesión
            </button>
        </aside>
    );
}
