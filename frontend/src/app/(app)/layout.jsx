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
            <div className="flex h-dvh min-h-screen w-full overflow-hidden bg-gray-100 print:h-auto print:min-h-0 print:overflow-visible print:bg-white">
                <Sidebar
                    abierto={sidebarAbierto}
                    onCerrar={() => setSidebarAbierto(false)}
                />

                <div className="flex min-h-0 min-w-0 flex-1 flex-col print:min-h-screen">
                    <Navbar onAbrirMenu={() => setSidebarAbierto(true)} />

                    <main className="vetcare-panel-background min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 print:overflow-visible print:p-0">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
