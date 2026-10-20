"use client";

import { useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Navbar from "../../components/layout/Navbar";
import ProtectedRoute from "../../components/auth/ProtectedRoute";

// Shell de toda la app "logueada": exige sesión (ProtectedRoute redirige a
// /login si no hay usuario) y dibuja el menú lateral + barra superior
// alrededor de cualquier página dentro de app/(app)/.
export default function AppLayout({ children }) {
    // Estado para controlar la apertura del menú lateral en pantallas pequeñas
    const [sidebarAbierto, setSidebarAbierto] = useState(false);

    return (
        <ProtectedRoute>
            <div className="flex bg-gray-100 min-h-screen">
                <Sidebar
                    abierto={sidebarAbierto}
                    onCerrar={() => setSidebarAbierto(false)}
                />

                <div className="flex-1 flex flex-col min-w-0">
                    <Navbar onAbrirMenu={() => setSidebarAbierto(true)} />

                    <main className="p-4 md:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
