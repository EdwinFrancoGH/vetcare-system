"use client";

import Sidebar from "../../components/layout/Sidebar";
import Navbar from "../../components/layout/Navbar";
import ProtectedRoute from "../../components/auth/ProtectedRoute";

// Shell de toda la app "logueada": exige sesión (ProtectedRoute redirige a
// /login si no hay usuario) y dibuja el menú lateral + barra superior
// alrededor de cualquier página dentro de app/(app)/.
export default function AppLayout({ children }) {
    return (
        <ProtectedRoute>
            <div className="flex bg-gray-100 min-h-screen">
                <Sidebar />

                <div className="flex-1 flex flex-col">
                    <Navbar />

                    <main className="p-8">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
