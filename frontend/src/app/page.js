"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

// Punto de entrada "/": antes redirigía siempre a /dashboard, pero ahora
// que existe el rol "Cliente" eso lo mandaría directo a una pantalla de
// "Acceso Denegado" (el Dashboard es clínico, no de cliente). Por eso
// este componente sí necesita saber el rol antes de decidir a dónde
// mandar a cada quien, y por lo tanto es "use client" en vez de un
// simple redirect() de servidor.
export default function Home() {
    const { user, userRole, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace("/login");
            return;
        }

        // Cliente no tiene acceso al Dashboard clínico (ver
        // components/layout/Sidebar.jsx y RequireRole en cada página):
        // su pantalla de inicio es Citas, donde reserva/consulta las
        // suyas.
        if (userRole === "Cliente") {
            router.replace("/citas");
        } else {
            router.replace("/dashboard");
        }
    }, [user, userRole, loading, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-white text-sm">Cargando...</p>
            </div>
        </div>
    );
}
