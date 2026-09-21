"use client";

import Link from "next/link";
import {
  FaHome,
  FaDog,
  FaNotesMedical,
  FaSyringe,
  FaUsers,
  FaBoxes,
  FaChartBar,
  FaCalendarAlt,
} from "react-icons/fa";

const menu = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: <FaHome />,
  },
  {
    name: "Mascotas",
    href: "/mascotas",
    icon: <FaDog />,
  },
  {
    name: "Historial Clínico",
    href: "/historial",
    icon: <FaNotesMedical />,
  },
  {
    name: "Citas",
    href: "/citas",
    icon: <FaCalendarAlt />,
  },
  {
    name: "Vacunas",
    href: "/vacunas",
    icon: <FaSyringe />,
  },
  {
    name: "Clientes",
    href: "/clientes",
    icon: <FaUsers />,
  },
  {
    name: "Inventario",
    href: "/inventario",
    icon: <FaBoxes />,
  },
  {
    name: "Reportes",
    href: "/reportes",
    icon: <FaChartBar />,
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-blue-900 text-white min-h-screen">
      <div className="text-3xl font-bold p-6 border-b border-blue-700">
        VetCare
      </div>

      <nav className="mt-6">
        {menu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-6 py-4 hover:bg-blue-800 transition"
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}