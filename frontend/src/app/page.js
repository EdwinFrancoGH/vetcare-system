
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function Home() {
    const { user, loading, emailVerified } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        // Usuario sin sesión.
        if (!user) {
            router.replace("/login");
            return;
        }

        // Identificar cuentas con correo y contraseña.
        const usesPasswordProvider = user.providerData?.some(
            (provider) => provider.providerId === "password"
        );

        // Solicitar verificación cuando sea necesaria.
        if (usesPasswordProvider && !emailVerified) {
            router.replace("/verify-email");
            return;
        }

        // Usuario con acceso permitido.
        router.replace("/dashboard");
    }, [user, loading, emailVerified, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />

                <p className="text-white text-sm">
                    Verificando tu sesión...
                </p>
            </div>
        </div>
    );
}
