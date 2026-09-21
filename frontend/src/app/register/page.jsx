"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "../../context/AuthContext";
import Swal from "sweetalert2";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
    const { register: registerUser } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm();

    const password = watch("password");

    const onSubmit = async ({ email, password }) => {
        setIsLoading(true);
        try {
            const userCredential = await registerUser(email, password);
            const token = await userCredential.user.getIdToken();
            
            await fetch("http://localhost:5001/api/auth/sync", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name: email.split('@')[0] })
            });

            Swal.fire({
                icon: "success",
                title: "¡Cuenta creada!",
                text: "Tu cuenta ha sido creada exitosamente.",
                timer: 2000,
                showConfirmButton: false,
            });
            router.push("/dashboard");
        } catch (error) {
            let message = "Ocurrió un error. Inténtalo de nuevo.";
            if (error.code === "auth/email-already-in-use") {
                message = "Este correo ya está registrado.";
            } else if (error.code === "auth/weak-password") {
                message = "La contraseña es muy débil. Usa al menos 6 caracteres.";
            }
            Swal.fire({
                icon: "error",
                title: "Error al registrarse",
                text: message,
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
                        <h2 className="text-2xl font-black text-black italic tracking-wide">CREAR CUENTA</h2>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold italic text-black mb-1.5 text-center">
                                Correo electronico
                            </label>
                            <input
                                id="reg-email"
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
                            <label className="block text-sm font-bold italic text-black mb-1.5 text-center">
                                Contraseña
                            </label>
                            <input
                                id="reg-password"
                                type="password"
                                placeholder="•••••••••"
                                className="w-full px-4 py-3 rounded-[2rem] bg-zinc-50 border border-zinc-400 text-zinc-800 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-bold tracking-widest placeholder-zinc-800"
                                {...register("password", {
                                    required: "La contraseña es requerida",
                                    minLength: { value: 6, message: "Mínimo 6 caracteres" },
                                })}
                            />
                            {errors.password && (
                                <p className="mt-1 text-xs text-red-500 text-center font-semibold">{errors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold italic text-black mb-1.5 text-center">
                                Confirmar Contraseña
                            </label>
                            <input
                                id="confirm-password"
                                type="password"
                                placeholder="•••••••••"
                                className="w-full px-4 py-3 rounded-[2rem] bg-zinc-50 border border-zinc-400 text-zinc-800 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-bold tracking-widest placeholder-zinc-800"
                                {...register("confirmPassword", {
                                    required: "Confirma tu contraseña",
                                    validate: (value) =>
                                        value === password || "Las contraseñas no coinciden",
                                })}
                            />
                            {errors.confirmPassword && (
                                <p className="mt-1 text-xs text-red-500 text-center font-semibold">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 px-4 bg-[#5c5c99] hover:bg-[#4a4a7e] disabled:bg-[#5c5c99]/70 text-white font-bold italic rounded-xl transition-all flex items-center justify-center gap-2 mt-4 shadow-md text-lg"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Cargando...
                                </>
                            ) : (
                                "Registrarse"
                            )}
                        </button>
                    </form>
                    
                    <p className="mt-6 text-center text-zinc-400 text-xs italic font-semibold">
                        ¿Ya tienes una cuenta? <Link href="/login" className="text-indigo-500 hover:text-indigo-700">Inicia sesión</Link>
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
