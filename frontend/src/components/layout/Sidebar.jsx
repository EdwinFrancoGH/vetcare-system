"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  User,
  LogOut,
  Calendar,
  PawPrint,
  Users,
  FileText,
  Syringe,
  Boxes,
  BarChart3,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const { userRole, logout } = useAuth();
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Inicio",
      icon: Home,
      href: "/dashboard",
      allowedRoles: ["Administrador", "Recepcionista", "Veterinario"],
    },
    {
      name: "Clientes",
      icon: Users,
      href: "/dashboard/clientes",
      allowedRoles: ["Administrador", "Recepcionista", "Veterinario"],
    },
    {
      name: "Mascotas",
      icon: PawPrint,
      href: "/dashboard/mascotas",
      allowedRoles: ["Administrador", "Recepcionista", "Veterinario"],
    },
    {
      name: "Historial Clínico",
      icon: FileText,
      href: "/dashboard/historial",
      allowedRoles: ["Administrador", "Veterinario"],
    },
    {
      name: "Vacunas",
      icon: Syringe,
      href: "/dashboard/vacunas",
      allowedRoles: ["Administrador", "Veterinario"],
    },
    {
      name: "Agenda",
      icon: Calendar,
      href: "/dashboard/citas",
      allowedRoles: ["Administrador", "Recepcionista"],
    },
    {
      name: "Inventario",
      icon: Boxes,
      href: "/dashboard/inventario",
      allowedRoles: ["Administrador"],
    },
    {
      name: "Reportes",
      icon: BarChart3,
      href: "/dashboard/reportes",
      allowedRoles: ["Administrador"],
    },
    {
      name: "Usuarios",
      icon: Users,
      href: "/dashboard/usuarios",
      allowedRoles: ["Administrador"],
    },
    {
      name: "Mi Perfil",
      icon: User,
      href: "/dashboard/profile",
      allowedRoles: [
        "Administrador",
        "Recepcionista",
        "Veterinario",
      ],
    },
  ];

  const visibleItems = menuItems.filter(
    (item) =>
      !item.allowedRoles || item.allowedRoles.includes(userRole)
  );

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-[#1e1b4b] text-white flex flex-col h-full border-r border-indigo-900/50 shadow-xl z-50">

      <div className="p-6 flex items-center gap-3 border-b border-indigo-900/50">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
          <PawPrint size={24} />
        </div>

        <span className="text-2xl font-bold">
          VetCare
        </span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-indigo-200 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-indigo-900/50">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>

    </aside>
  );
}