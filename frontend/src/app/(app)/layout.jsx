"use client";

import { useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Navbar from "../../components/layout/Navbar";
import ProtectedRoute from "../../components/auth/ProtectedRoute";

// Shell de toda la app "logueada": exige sesión (ProtectedRoute redirige a
// /login si no hay usuario) y dibuja el menú lateral + barra superior
// alrededor de cualquier página dentro de app/(app)/.
export default function AppLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <ProtectedRoute>
            <div className="flex h-dvh w-full overflow-hidden">
                <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
                    <Navbar onMenuClick={() => setSidebarOpen(true)} />

                    <main className="vetcare-panel-background min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
