
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "../../../context/AuthContext";
import { auth } from "../../../lib/firebase";
import api from "../../../services/api";
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

        let accountCreated = false;
        let verificationSent = false;

        try {
            // Registrar al usuario en Firebase Authentication.
            // Esta función también envía el correo de verificación.
            await registerUser(email, password);

            accountCreated = true;
            verificationSent = true;

            // Sincronizar el usuario con Firestore mediante el backend.
            // El interceptor de api.js adjunta el token de Firebase.
            await api.post("/auth/sync", {
                name: email.split("@")[0],
            });

            await Swal.fire({
                icon: "success",
                title: "¡Cuenta creada!",
                text:
                    "Te enviamos un correo de verificación. " +
                    "Revisa tu bandeja de entrada y confirma tu dirección.",
                confirmButtonText: "Entendido",
                confirmButtonColor: "#5c5c99",
            });

            // El usuario debe verificar su correo antes de continuar.
            router.replace("/verify-email");

        } catch (error) {
            console.error("Error durante el registro:", error);

            // Firebase puede crear la cuenta aunque falle el envío
            // del correo de verificación.
            const currentUser = auth.currentUser;

            if (
                currentUser &&
                currentUser.email?.toLowerCase() === email.toLowerCase()
            ) {
                accountCreated = true;
            }

            // Si la cuenta existe, no debemos intentar registrarla otra vez.
            if (accountCreated) {
                const message = verificationSent
                    ? "Tu cuenta fue creada y se envió el correo de verificación, " +
                      "pero ocurrió un problema al sincronizar los datos. " +
                      "Puedes comprobar tu correo o solicitar otro enlace."
                    : "Tu cuenta fue creada, pero no pudimos confirmar " +
                      "el envío del correo de verificación. " +
                      "Puedes solicitar otro enlace desde la siguiente pantalla.";

                await Swal.fire({
                    icon: "warning",
                    title: "Cuenta creada con una advertencia",
                    text: message,
                    confirmButtonText: "Continuar",
                    confirmButtonColor: "#5c5c99",
                });

                router.replace("/verify-email");
                return;
            }

            let message = "Ocurrió un error. Inténtalo nuevamente.";

            if (error.code === "auth/email-already-in-use") {
                message = "Este correo ya está registrado.";
            } else if (error.code === "auth/weak-password") {
                message =
                    "La contraseña es muy débil. Usa al menos 6 caracteres.";
            } else if (error.code === "auth/invalid-email") {
                message = "Ingresa una dirección de correo válida.";
            } else if (error.code === "auth/too-many-requests") {
                message =
                    "Demasiados intentos. Espera unos minutos e inténtalo nuevamente.";
            } else if (error.code === "auth/network-request-failed") {
                message =
                    "No se pudo establecer conexión. Revisa tu internet.";
            }

            await Swal.fire({
                icon: "error",
                title: "Error al registrarse",
                text: message,
                confirmButtonText: "Entendido",
                confirmButtonColor: "#5c5c99",
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
                                <span className="text-4xl font-extrabold tracking-tight text-indigo-900 leading-none">
                                    VetCare
                                </span>

                                <span className="text-[0.6rem] text-indigo-500 tracking-widest font-semibold uppercase">
                                    Sistema de Gestión Veterinaria
                                </span>
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-black italic tracking-wide">
                            CREAR CUENTA
                        </h2>
                    </div>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-5"
                    >
                        {/* Correo electrónico */}
                        <div>
                            <label
                                htmlFor="reg-email"
                                className="block text-sm font-bold italic text-black mb-1.5 text-center"
                            >
                                Correo electrónico
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
                                <p className="mt-1 text-xs text-red-500 text-center font-semibold">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label
                                htmlFor="reg-password"
                                className="block text-sm font-bold italic text-black mb-1.5 text-center"
                            >
                                Contraseña
                            </label>

                            <input
                                id="reg-password"
                                type="password"
                                placeholder="•••••••••"
                                className="w-full px-4 py-3 rounded-[2rem] bg-zinc-50 border border-zinc-400 text-zinc-800 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-bold tracking-widest placeholder-zinc-800"
                                {...register("password", {
                                    required: "La contraseña es requerida",
                                    minLength: {
                                        value: 6,
                                        message: "Mínimo 6 caracteres",
                                    },
                                })}
                            />

                            {errors.password && (
                                <p className="mt-1 text-xs text-red-500 text-center font-semibold">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Confirmar contraseña */}
                        <div>
                            <label
                                htmlFor="confirm-password"
                                className="block text-sm font-bold italic text-black mb-1.5 text-center"
                            >
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
                                        value === password ||
                                        "Las contraseñas no coinciden",
                                })}
                            />

                            {errors.confirmPassword && (
                                <p className="mt-1 text-xs text-red-500 text-center font-semibold">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        {/* Botón de registro */}
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
                        ¿Ya tienes una cuenta?{" "}
                        <Link
                            href="/login"
                            className="text-indigo-500 hover:text-indigo-700"
                        >
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>

            {/* Área de mascotas (Derecha) */}
            <div className="absolute right-0 bottom-0 hidden lg:block w-[50vw] max-w-[650px] h-screen z-10 pointer-events-none">
                <div
                    className="w-full h-full relative"
                    style={{
                        WebkitMaskImage:
                            "radial-gradient(ellipse 80% 80% at 60% 60%, black 30%, transparent 80%)",
                        maskImage:
                            "radial-gradient(ellipse 80% 80% at 60% 60%, black 30%, transparent 80%)",
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
