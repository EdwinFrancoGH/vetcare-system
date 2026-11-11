
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import Swal from "sweetalert2";
import Link from "next/link";
import Image from "next/image";
import { PawPrint } from "lucide-react";

export default function LoginPage() {
    const { login, loginWithGoogle, refreshUserData, logout } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    // Inicio de sesión tradicional.
    const onSubmit = async ({ email, password }) => {
        setIsLoading(true);

        try {
            await login(email, password);

            await Swal.fire({
                icon: "success",
                title: "¡Bienvenido!",
                text: "Has iniciado sesión correctamente.",
                timer: 1500,
                showConfirmButton: false,
            });

            router.push("/");
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

            await Swal.fire({
                icon: "error",
                title: "Error al iniciar sesión",
                text: message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Inicio de sesión mediante Google.
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        let googleAuthenticated = false;

        try {
            const googleUser = await loginWithGoogle();
            googleAuthenticated = true;

            // Sincronizar el usuario con Firestore mediante el backend.
            // Los usuarios nuevos reciben el rol Cliente.
            // Los existentes conservan su rol.
            await api.post("/auth/sync", {
                name:
                    googleUser.displayName ||
                    googleUser.email?.split("@")[0] ||
                    "",
            });

            // Actualizar el perfil y rol del usuario.
            await refreshUserData();

            await Swal.fire({
                icon: "success",
                title: "¡Bienvenido a VetCare!",
                text: "Has iniciado sesión con Google correctamente.",
                timer: 1500,
                showConfirmButton: false,
            });

            router.push("/");
        } catch (error) {
            console.error("Error al iniciar sesión con Google:", error);

            // Si el usuario simplemente cierra la ventana de Google,
            // no mostramos un error innecesario.
            if (
                error.code === "auth/popup-closed-by-user" ||
                error.code === "auth/cancelled-popup-request"
            ) {
                return;
            }

            let message = "No se pudo iniciar sesión con Google.";

            if (error.code === "auth/popup-blocked") {
                message =
                    "El navegador bloqueó la ventana de Google. Permití las ventanas emergentes.";
            } else if (error.code === "auth/unauthorized-domain") {
                message =
                    "Este dominio todavía no está autorizado en Firebase Authentication.";
            } else if (
                error.code === "auth/account-exists-with-different-credential"
            ) {
                message =
                    "Ya existe una cuenta con este correo utilizando otro método de acceso.";
            } else if (error.response?.status === 401) {
                message =
                    "El servidor no pudo validar tu sesión de Firebase.";
            } else if (error.response?.status === 403) {
                message =
                    "No tenés permisos para completar el inicio de sesión.";
            } else if (error.response) {
                message =
                    "No se pudo sincronizar tu perfil con el servidor.";
            }

            // Cerrar una sesión de Google si falla la sincronización.
            if (googleAuthenticated) {
                try {
                    await logout();
                } catch (logoutError) {
                    console.error(
                        "Error cerrando sesión incompleta:",
                        logoutError
                    );
                }
            }

            await Swal.fire({
                icon: "error",
                title: "Error al iniciar sesión",
                text: message,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="vetcare-login-background min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans">

            {/* Huellas decorativas */}
            <div className="absolute top-12 left-12 hidden lg:flex flex-col gap-4 opacity-70">
                <PawPrint
                    size={48}
                    className="text-gray-300 -rotate-12"
                    fill="currentColor"
                />
                <PawPrint
                    size={56}
                    className="text-gray-300 rotate-12 ml-10"
                    fill="currentColor"
                />
            </div>

            {/* Contenedor principal */}
            <div className="relative w-full max-w-5xl min-h-[600px] lg:min-h-[700px] flex items-center">

                {/* Tarjeta blanca */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 lg:p-16 w-full max-w-lg mx-auto lg:mx-0 lg:ml-24 relative z-20">

                    {/* Logo */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="flex items-center gap-2 text-indigo-900 mb-6">
                            <PawPrint
                                size={40}
                                className="text-indigo-600"
                                fill="currentColor"
                            />

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
                            INICIAR SESION
                        </h2>
                    </div>

                    {/* Formulario de correo y contraseña */}
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-bold italic text-black mb-2 text-center"
                            >
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
                                <p className="mt-1 text-xs text-red-500 text-center font-semibold">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-bold italic text-black mb-2 text-center"
                            >
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
                                <p className="mt-1 text-xs text-red-500 text-center font-semibold">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-center pt-1">
                            <Link
                                href="/forgot-password"
                                className="text-sm text-indigo-600/80 hover:text-indigo-800 font-bold italic transition-colors"
                            >
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

                    {/* Separador */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="h-px bg-zinc-300 flex-1" />
                        <span className="text-xs text-zinc-500 font-semibold">
                            O CONTINUAR CON
                        </span>
                        <div className="h-px bg-zinc-300 flex-1" />
                    </div>

                    {/* Botón de Google */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-white hover:bg-zinc-50 border border-zinc-300 disabled:opacity-60 text-zinc-800 font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm"
                    >
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                        >
                            <path
                                fill="#EA4335"
                                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 5.38 6.51 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                            />
                            <path
                                fill="#4285F4"
                                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.28 5.48-4.8 7.18l7.73 6C44.38 38.03 46.98 31.88 46.98 24.55z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.77-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"
                            />
                            <path
                                fill="#34A853"
                                d="M24 48c6.48 0 11.92-2.13 15.89-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.97 6.19C6.51 42.62 14.62 48 24 48z"
                            />
                        </svg>

                        {isLoading
                            ? "Procesando..."
                            : "Continuar con Google"}
                    </button>

                    {/* Registro */}
                    <p className="mt-6 text-center text-zinc-400 text-xs italic font-semibold">
                        ¿No tienes una cuenta?{" "}
                        <Link
                            href="/register"
                            className="text-indigo-500 hover:text-indigo-700"
                        >
                            Regístrate
                        </Link>
                    </p>
                </div>
            </div>

            {/* Imagen de mascotas */}
            <div className="absolute right-0 bottom-0 hidden lg:block w-[50vw] max-w-[650px] h-screen z-10 pointer-events-none">
                <div className="w-full h-full relative">
                    <Image
                        src="/images/pets.png"
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
