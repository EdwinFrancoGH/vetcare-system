"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../../context/AuthContext";
import Swal from "sweetalert2";
import { FiMail, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPasswordPage() {
    const { resetPassword } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const onSubmit = async ({ email }) => {
        setIsLoading(true);
        try {
            await resetPassword(email);
            setSent(true);
        } catch (error) {
            let message = "Ocurrió un error. Inténtalo de nuevo.";
            if (error.code === "auth/user-not-found") {
                message = "No existe una cuenta con ese correo.";
            }
            Swal.fire({
                icon: "error",
                title: "Error",
                text: message,
                background: "#1e293b",
                color: "#f8fafc",
                confirmButtonColor: "#3b82f6",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0d1533] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            
            {/* Contenedor Principal */}
            <div className="relative w-full max-w-5xl min-h-[600px] lg:min-h-[700px] flex items-center">
                
                {/* Tarjeta Blanca Central */}
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

                    {sent ? (
                        <div className="text-center">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                                <span className="text-4xl">📧</span>
                            </div>
                            <h2 className="text-2xl font-black text-black italic tracking-wide mb-2">¡CORREO ENVIADO!</h2>
                            <p className="text-zinc-500 font-medium mb-6">
                                Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold italic transition-colors"
                            >
                                <FiArrowLeft className="w-4 h-4" />
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="mb-8 text-center">
                                <h2 className="text-2xl font-black text-black italic tracking-wide">RECUPERAR CONTRASEÑA</h2>
                                <p className="text-zinc-500 text-sm font-medium mt-2">
                                    Te enviaremos un enlace para restablecerla.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div>
                                    <label htmlFor="reset-email" className="block text-sm font-bold italic text-black mb-1.5 text-center">
                                        Correo electrónico
                                    </label>
                                    <div className="relative">
                                        <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 w-5 h-5" />
                                        <input
                                            id="reset-email"
                                            type="email"
                                            placeholder="ejemplo@vetcare.com"
                                            autoComplete="email"
                                            className="w-full pl-12 pr-4 py-3 rounded-[2rem] bg-zinc-50 border border-zinc-400 text-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium italic placeholder-indigo-300/70"
                                            {...register("email", {
                                                required: "El correo es requerido",
                                                pattern: {
                                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                    message: "Ingresa un correo válido",
                                                },
                                            })}
                                        />
                                    </div>
                                    {errors.email && <p className="mt-1.5 text-xs text-red-500 text-center font-semibold">{errors.email.message}</p>}
                                </div>

                                <button
                                    id="btn-reset-password"
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 px-4 bg-[#5c5c99] hover:bg-[#4a4a7e] disabled:bg-[#5c5c99]/70 text-white font-bold italic rounded-xl transition-all flex items-center justify-center gap-2 mt-4 shadow-md text-lg"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        "Enviar Enlace"
                                    )}
                                </button>
                            </form>

                            <p className="mt-6 text-center text-zinc-400 text-xs italic font-semibold">
                                <Link href="/login" className="inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-700 transition-colors">
                                    <FiArrowLeft className="w-3 h-3" />
                                    Volver al inicio de sesión
                                </Link>
                            </p>
                        </>
                    )}
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
