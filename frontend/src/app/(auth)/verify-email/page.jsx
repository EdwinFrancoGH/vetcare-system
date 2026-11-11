
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import Swal from "sweetalert2";
import Link from "next/link";

export default function VerifyEmailPage() {
    const router = useRouter();

    const {
        user,
        loading,
        resendVerificationEmail,
        checkEmailVerification,
        logout,
    } = useAuth();

    const [isChecking, setIsChecking] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const handleCheckVerification = async () => {
        setIsChecking(true);

        try {
            const verified = await checkEmailVerification();

            if (verified) {
                await Swal.fire({
                    icon: "success",
                    title: "¡Correo verificado!",
                    text: "Tu dirección de correo ha sido confirmada.",
                });

                router.replace("/");
            } else {
                await Swal.fire({
                    icon: "warning",
                    title: "Correo pendiente",
                    text: "Todavía no se ha verificado tu correo. Revisa tu bandeja de entrada y spam.",
                });
            }
        } catch (error) {
            console.error("Error verificando correo:", error);

            await Swal.fire({
                icon: "error",
                title: "No se pudo comprobar",
                text: "Inténtalo nuevamente en unos momentos.",
            });
        } finally {
            setIsChecking(false);
        }
    };

    const handleResend = async () => {
        setIsResending(true);

        try {
            const sent = await resendVerificationEmail();

            if (!sent) {
                await Swal.fire({
                    icon: "success",
                    title: "Correo ya verificado",
                    text: "Tu correo ya está confirmado.",
                });
                return;
            }

            await Swal.fire({
                icon: "success",
                title: "¡Correo enviado!",
                text: "Revisa tu bandeja de entrada y la carpeta de spam.",
            });
        } catch (error) {
            console.error("Error reenviando verificación:", error);

            await Swal.fire({
                icon: "error",
                title: "No se pudo reenviar",
                text:
                    error.code === "auth/too-many-requests"
                        ? "Demasiados intentos. Espera unos minutos."
                        : "Inténtalo nuevamente más tarde.",
            });
        } finally {
            setIsResending(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            router.replace("/login");
        } catch (error) {
            console.error("Error cerrando sesión:", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0d1533] flex items-center justify-center text-white">
                Cargando...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0d1533] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-lg text-center">

                <div className="text-5xl mb-4">🐾</div>

                <h1 className="text-3xl font-extrabold text-indigo-900 mb-3">
                    Verifica tu correo
                </h1>

                <p className="text-zinc-600 mb-4">
                    Para proteger tu cuenta de VetCare, necesitamos
                    confirmar tu dirección de correo electrónico.
                </p>

                {user?.email && (
                    <p className="font-bold text-indigo-700 mb-6 break-all">
                        {user.email}
                    </p>
                )}

                {!user ? (
                    <div className="space-y-4">
                        <p className="text-zinc-600">
                            Inicia sesión para comprobar tu verificación
                            o solicitar otro correo.
                        </p>

                        <Link
                            href="/login"
                            className="block w-full bg-indigo-700 text-white font-bold py-3 rounded-xl hover:bg-indigo-800"
                        >
                            Ir al inicio de sesión
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <button
                            type="button"
                            onClick={handleCheckVerification}
                            disabled={isChecking || isResending}
                            className="w-full bg-indigo-700 text-white font-bold py-3 rounded-xl hover:bg-indigo-800 disabled:opacity-60"
                        >
                            {isChecking
                                ? "Comprobando..."
                                : "Ya verifiqué mi correo"}
                        </button>

                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={isChecking || isResending}
                            className="w-full border-2 border-indigo-700 text-indigo-700 font-bold py-3 rounded-xl hover:bg-indigo-50 disabled:opacity-60"
                        >
                            {isResending
                                ? "Enviando..."
                                : "Reenviar correo de verificación"}
                        </button>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full text-zinc-500 font-semibold py-2 hover:text-red-600"
                        >
                            Cerrar sesión
                        </button>
                    </div>
                )}

                <p className="text-xs text-zinc-400 mt-8">
                    Si no encuentras el correo, revisa también tu carpeta
                    de spam o correo no deseado.
                </p>
            </div>
        </div>
    );
}
