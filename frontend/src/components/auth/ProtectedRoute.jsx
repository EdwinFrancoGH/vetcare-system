
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
    const { user, loading, emailVerified } = useAuth();
    const router = useRouter();

    // Identificar cuentas registradas con correo y contraseña.
    const usesPasswordProvider = user?.providerData?.some(
        (provider) => provider.providerId === "password"
    );

    // Comprobar si el usuario necesita verificar su correo.
    const requiresEmailVerification =
        Boolean(user) &&
        usesPasswordProvider &&
        !emailVerified;

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace("/login");
            return;
        }

        if (requiresEmailVerification) {
            router.replace("/verify-email");
        }
    }, [user, loading, requiresEmailVerification, router]);

    // No mostrar contenido privado mientras se verifica el acceso.
    if (loading || !user || requiresEmailVerification) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />

                    <p className="text-white text-sm">
                        Verificando acceso a VetCare...
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
