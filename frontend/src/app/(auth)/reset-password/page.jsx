"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";
import { FiLock, FiArrowLeft, FiCheckCircle } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../../../lib/firebase";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const oobCode = searchParams.get("oobCode");
    
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [isValidCode, setIsValidCode] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [email, setEmail] = useState("");

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm();

    const password = watch("password");

    useEffect(() => {
        if (!oobCode) {
            setIsValidCode(false);
            setIsVerifying(false);
            return;
        }

        // Verificar si el código es válido antes de dejar cambiar la contraseña
        verifyPasswordResetCode(auth, oobCode)
            .then((email) => {
                setEmail(email);
                setIsValidCode(true);
            })
            .catch((error) => {
                console.error("Invalid or expired code", error);
                setIsValidCode(false);
            })
            .finally(() => {
                setIsVerifying(false);
            });
    }, [oobCode]);

    const onSubmit = async ({ password }) => {
        if (!oobCode) return;
        
        setIsLoading(true);
        try {
            await confirmPasswordReset(auth, oobCode, password);
            setIsSuccess(true);
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo cambiar la contraseña. El enlace puede haber expirado.",
                background: "#1e293b",
                color: "#f8fafc",
                confirmButtonColor: "#3b82f6",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isVerifying) {
        return (
            <div className="flex flex-col items-center justify-center py-10">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-zinc-500 font-medium italic">Verificando enlace...</p>
            </div>
        );
    }

    if (!isValidCode && !isSuccess) {
        return (
            <div className="text-center py-8">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                    <span className="text-4xl">❌</span>
                </div>
                <h2 className="text-2xl font-black text-black italic tracking-wide mb-2">ENLACE INVÁLIDO</h2>
                <p className="text-zinc-500 font-medium mb-6">
                    Este enlace de recuperación ha expirado o no es válido. Por favor, solicita uno nuevo.
                </p>
                <Link
                    href="/forgot-password"
                    className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold italic transition-colors"
                >
                    <FiArrowLeft className="w-4 h-4" />
                    Solicitar nuevo enlace
                </Link>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                    <FiCheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-black text-black italic tracking-wide mb-2">¡CONTRASEÑA ACTUALIZADA!</h2>
                <p className="text-zinc-500 font-medium mb-6">
                    Tu contraseña ha sido cambiada exitosamente. Ya puedes acceder a tu cuenta.
                </p>
                <Link
                    href="/login"
                    className="inline-flex items-center justify-center w-full py-4 px-4 bg-[#5c5c99] hover:bg-[#4a4a7e] text-white font-bold italic rounded-xl transition-all shadow-md text-lg"
                >
                    Ir al Inicio de Sesión
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-black text-black italic tracking-wide">NUEVA CONTRASEÑA</h2>
                <p className="text-zinc-500 text-sm font-medium mt-2">
                    Ingresa una nueva contraseña segura para tu cuenta <span className="font-bold text-indigo-600">{email}</span>.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                    <label className="block text-sm font-bold italic text-black mb-1.5 text-center">
                        Nueva Contraseña
                    </label>
                    <div className="relative">
                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5" />
                        <input
                            type="password"
                            placeholder="•••••••••"
                            className="w-full pl-12 pr-4 py-3 rounded-[2rem] bg-zinc-50 border border-zinc-400 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-bold tracking-widest placeholder-zinc-400"
                            {...register("password", {
                                required: "La contraseña es requerida",
                                minLength: { value: 6, message: "Mínimo 6 caracteres" },
                            })}
                        />
                    </div>
                    {errors.password && <p className="mt-1.5 text-xs text-red-500 text-center font-semibold">{errors.password.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-bold italic text-black mb-1.5 text-center">
                        Confirmar Contraseña
                    </label>
                    <div className="relative">
                        <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5" />
                        <input
                            type="password"
                            placeholder="•••••••••"
                            className="w-full pl-12 pr-4 py-3 rounded-[2rem] bg-zinc-50 border border-zinc-400 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-bold tracking-widest placeholder-zinc-400"
                            {...register("confirmPassword", {
                                required: "Debes confirmar tu contraseña",
                                validate: (value) =>
                                    value === password || "Las contraseñas no coinciden",
                            })}
                        />
                    </div>
                    {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-500 text-center font-semibold">{errors.confirmPassword.message}</p>}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 px-4 bg-[#5c5c99] hover:bg-[#4a4a7e] disabled:bg-[#5c5c99]/70 text-white font-bold italic rounded-xl transition-all flex items-center justify-center gap-2 mt-4 shadow-md text-lg"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        "Cambiar Contraseña"
                    )}
                </button>
            </form>
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-[#0d1533] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            <div className="relative w-full max-w-5xl min-h-[600px] lg:min-h-[700px] flex items-center">
                <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 lg:p-16 w-full max-w-lg mx-auto lg:mx-0 lg:ml-24 relative z-20">
                    <div className="flex flex-col items-center mb-8">
                        <div className="flex items-center gap-2 text-indigo-900 mb-6">
                            <span className="text-4xl text-indigo-600">🐾</span>
                            <div className="flex flex-col">
                                <span className="text-4xl font-extrabold tracking-tight text-indigo-900 leading-none">VetCare</span>
                                <span className="text-[0.6rem] text-indigo-500 tracking-widest font-semibold uppercase">Sistema de Gestión Veterinaria</span>
                            </div>
                        </div>
                    </div>

                    <Suspense fallback={
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-zinc-500 font-medium italic">Cargando...</p>
                        </div>
                    }>
                        <ResetPasswordForm />
                    </Suspense>

                </div>
            </div>

            {/* Área de mascotas (Derecha) */}
            <div className="absolute right-0 bottom-0 hidden lg:block w-[50vw] max-w-[650px] h-screen z-10 pointer-events-none">
                <div 
                    className="w-full h-full relative"
                    style={{
                        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 60% 60%, black 30%, transparent 80%)',
                        maskImage: 'radial-gradient(ellipse 80% 80% at 60% 60%, black 30%, transparent 80%)'
                    }}
                >
                    <Image 
                        src="/images/pets.jpg" 
                        alt="Dog and Cat" 
                        fill
                        priority
                        className="object-contain object-bottom origin-bottom scale-90"
                    />
                </div>
            </div>
        </div>
    );
}
