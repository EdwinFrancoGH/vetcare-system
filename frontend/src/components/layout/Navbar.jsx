"use client";

import { Bell, Search, UserCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { userData } = useAuth();

  const displayName = userData?.name || "Usuario VetCare";
  const displayRole = userData?.role || "Cargando...";

  return (
    <header className="h-20 bg-white border-b border-zinc-200 flex items-center justify-between px-8 z-40 relative">
      <div className="flex items-center bg-zinc-100 rounded-full px-4 py-2 w-96 border border-zinc-200 focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-transparent transition-all">
        <Search className="text-zinc-400" size={20} />

        <input
          type="text"
          placeholder="Buscar pacientes, dueños, citas..."
          className="bg-transparent border-none outline-none ml-3 w-full text-sm text-zinc-700 placeholder-zinc-400"
        />
      </div>

      <div className="flex items-center gap-6">
        <button className="relative text-zinc-400 hover:text-emerald-500 transition-colors">
          <Bell size={24} />
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="flex items-center gap-3 pl-6 border-l border-zinc-200 cursor-pointer group">
          <div className="text-right">
            <p className="text-sm font-semibold text-zinc-700 group-hover:text-emerald-600 transition-colors">
              {displayName}
            </p>

            <p className="text-xs text-zinc-500">
              {displayRole}
            </p>
          </div>

          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200 group-hover:scale-105 transition-transform">
            <UserCircle size={28} />
          </div>
        </div>
      </div>
    </header>
  );
}