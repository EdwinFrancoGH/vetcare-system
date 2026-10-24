"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaBars, FaBell, FaUserCircle } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

export default function Navbar({ onMenuClick }) {
    const { userData } = useAuth();
    const [logoOpen, setLogoOpen] = useState(false);

    useEffect(() => {
        if (!logoOpen) return;
        const closeOnEscape = (event) => {
            if (event.key === "Escape") setLogoOpen(false);
        };
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, [logoOpen]);

    const displayName = userData?.name || "Usuario VetCare";
    const displayRole = userData?.role || "";

    return (
        <header className="z-10 flex min-h-16 shrink-0 items-center justify-between gap-2 bg-white px-3 shadow sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <button
                    type="button"
                    onClick={onMenuClick}
                    aria-label="Abrir menú"
                    className="rounded-md p-2 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 md:hidden"
                >
                    <FaBars />
                </button>
                <h1 className="whitespace-nowrap text-sm font-semibold text-gray-700 min-[400px]:text-base sm:text-xl">
                    Sistema Veterinario
                </h1>
                <button
                    type="button"
                    onClick={() => setLogoOpen(true)}
                    aria-label="Ver logo de VetCare"
                    className="flex items-center gap-1.5 rounded-md p-1 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <Image
                        src="/images/logo-vetcare.png"
                        alt="Logo VetCare"
                        width={40}
                        height={40}
                        className="h-10 w-10 object-contain"
                    />
                    <span className="hidden text-[11px] text-gray-400 sm:inline">Clic aquí</span>
                </button>
            </div>

            <div className="flex shrink-0 items-center gap-2 text-gray-600 sm:gap-4 lg:gap-6">
                <FaBell className="hidden cursor-pointer text-xl sm:block" />

                <Link href="/profile" className="flex items-center gap-2 hover:text-blue-900 transition">
                    {userData?.photoURL ? (
                        <img
                            src={userData.photoURL}
                            alt="Foto de perfil"
                            className="w-9 h-9 rounded-full object-cover"
                        />
                    ) : (
                        <FaUserCircle className="text-3xl cursor-pointer" />
                    )}
                    <div className="hidden text-left text-sm leading-tight sm:block">
                        <p className="font-semibold">{displayName}</p>
                        {displayRole && <p className="text-xs text-gray-400">{displayRole}</p>}
                    </div>
                </Link>
            </div>

            {logoOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    onClick={() => setLogoOpen(false)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Información de VetCare"
                        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setLogoOpen(false)}
                            aria-label="Cerrar modal"
                            className="absolute right-3 top-3 rounded-full px-3 py-1 text-2xl leading-none text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                        >
                            ×
                        </button>
                        <div className="grid items-center gap-6 sm:grid-cols-2 sm:gap-10">
                            <div className="space-y-5 pr-2 text-gray-700">
                                <div>
                                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">VetCare</p>
                                    <h2 className="mt-1 text-2xl font-bold text-slate-800">¿Quiénes somos?</h2>
                                    <p className="mt-2 leading-relaxed">
                                        Somos un equipo comprometido con el cuidado integral de las mascotas y el acompañamiento cercano a sus familias. En VetCare reunimos su información clínica para brindar una atención organizada y responsable.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-800">Nuestra misión</h3>
                                    <p className="mt-2 leading-relaxed">
                                        Facilitar una atención veterinaria accesible, oportuna y de calidad, apoyando a cada profesional en el cuidado de la salud y el bienestar de los animales.
                                    </p>
                                </div>
                            </div>
                            <div className="relative mx-auto h-64 w-full max-w-sm sm:h-[26rem]">
                                <Image
                                    src="/images/dr-caramelo-vet.png"
                                    alt="Perro vestido como veterinario"
                                    fill
                                    sizes="(max-width: 640px) 100vw, 384px"
                                    className="object-contain"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
