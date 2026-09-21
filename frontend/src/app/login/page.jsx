"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import Swal from "sweetalert2";
import Link from "next/link";
import Image from "next/image";
import { PawPrint } from "lucide-react";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const onSubmit = async ({ email, password }) => {
        setIsLoading(true);
        try {
            await login(email, password);
            Swal.fire({
                icon: "success",
                title: "¡Bienvenido!",
                text: "Has iniciado sesión correctamente.",
                timer: 1500,
                showConfirmButton: false,
            });
            router.push("/dashboard");
        } catch (error) {
            let message = "Ocurrió un error. Inténtalo de nuevo.";
            if (
                error.code === "auth/user-not-found" ||
                error.code === "auth/wrong-password" ||
                error.code === "auth/invalid-credential"
            ) {
                message = "Correo o contraseña incorrectos.";
            } else if (error.code === "auth/too-many-requests") {
                message = "Demasiados intentos fallidos. Intenta más tarde.";
            }
            Swal.fire({
                icon: "error",
                title: "Error al iniciar sesión",
                text: message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0d1533] flex items-center justify-center p-4 relative overflow-hidden font-sans">
            
            {/* Huellas decorativas esquina superior izquierda */}
            <div className="absolute top-12 left-12 hidden lg:flex flex-col gap-4 opacity-70">
                <PawPrint size={48} className="text-gray-300 -rotate-12" fill="currentColor" />
                <PawPrint size={56} className="text-gray-300 rotate-12 ml-10" fill="currentColor" />
            </div>

            {/* Contenedor Principal */}
            <div className="relative w-full max-w-5xl min-h-[600px] lg:min-h-[700px] flex items-center">
                
                {/* Tarjeta Blanca Central */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 lg:p-16 w-full max-w-lg mx-auto lg:mx-0 lg:ml-24 relative z-20">
                    
                    {/* Logo (Simulado para que se parezca al del mockup) */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="flex items-center gap-2 text-indigo-900 mb-6">
                            <PawPrint size={40} className="text-indigo-600" fill="currentColor" />
                            <div className="flex flex-col">
                                <span className="text-4xl font-extrabold tracking-tight text-indigo-900 leading-none">VetCare</span>
                                <span className="text-[0.6rem] text-indigo-500 tracking-widest font-semibold uppercase">Sistema de Gestión Veterinaria</span>
                            </div>
                        </div>
                        <h2 className="text-2xl font-black text-black italic tracking-wide">INICIAR SESION</h2>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold italic text-black mb-2 text-center">
                                Correo electronico
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="ejemplo@vetcare.com"
                                className="w-full px-4 py-3 rounded-[2rem] bg-zinc-50 border border-zinc-400 text-zinc-800 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium italic placeholder-indigo-300/70"
                                {...register("email", {
                                    required: "El correo es requerido",
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: "Ingresa un correo válido",
                                    },
                                })}
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-500 text-center font-semibold">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold italic text-black mb-2 text-center">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                placeholder="•••••••••"
                                className="w-full px-4 py-3 rounded-[2rem] bg-zinc-50 border border-zinc-400 text-zinc-800 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-bold tracking-widest placeholder-zinc-800"
                                {...register("password", {
                                    required: "La contraseña es requerida",
                                })}
                            />
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-500 text-center font-semibold">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="flex justify-center pt-1">
                            <Link href="/forgot-password" className="text-sm text-indigo-600/80 hover:text-indigo-800 font-bold italic transition-colors">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 px-4 bg-[#5c5c99] hover:bg-[#4a4a7e] disabled:bg-[#5c5c99]/70 text-white font-bold italic rounded-xl transition-all flex items-center justify-center gap-2 mt-2 shadow-md text-lg"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Cargando...
                                </>
                            ) : (
                                "Iniciar Sesion"
                            )}
                        </button>
                    </form>
                    
                    <p className="mt-6 text-center text-zinc-400 text-xs italic font-semibold">
                        ¿No tienes una cuenta? <Link href="/register" className="text-indigo-500 hover:text-indigo-700">Regístrate</Link>
                    </p>
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
