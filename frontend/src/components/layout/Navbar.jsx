"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FaBars, FaBell, FaUserCircle, FaCalendarAlt, FaSyringe, FaShoppingBag } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import useRecordatoriosCliente from "../../hooks/useRecordatoriosCliente";
import CampanaPersonal from "./CampanaPersonal";

function CampanaCliente() {
    const { recordatorios, cargando } = useRecordatoriosCliente();
    const [abierto, setAbierto] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickAfuera(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setAbierto(false);
            }
        }

        function handleKeyDown(e) {
            if (e.key === "Escape") {
                setAbierto(false);
            }
        }

        if (abierto) {
            document.addEventListener("mousedown", handleClickAfuera);
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickAfuera);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [abierto]);

    const cantidad = recordatorios.length;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setAbierto((prev) => !prev)}
                className="relative text-gray-600 hover:text-blue-900 transition p-1.5 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                aria-label="Notificaciones"
                title="Notificaciones"
            >
                <FaBell className="text-xl" />
                {cantidad > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm">
                        {cantidad}
                    </span>
                )}
            </button>

            {abierto && (
                <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 p-4 text-gray-800">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                        <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">
                            <span>Notificaciones</span>
                            {cantidad > 0 && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                                    {cantidad}
                                </span>
                            )}
                        </h3>
                        <Link
                            href="/dashboard"
                            onClick={() => setAbierto(false)}
                            className="text-xs font-semibold text-blue-700 hover:text-blue-900 transition"
                        >
                            Ver panel &rarr;
                        </Link>
                    </div>

                    {cargando ? (
                        <p className="text-xs text-gray-500 py-4 text-center">
                            Cargando notificaciones...
                        </p>
                    ) : cantidad === 0 ? (
                        <p className="text-xs text-green-700 py-4 text-center font-medium">
                            No tienes recordatorios pendientes ✓
                        </p>
                    ) : (
                        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                            {recordatorios.map((r) => {
                                const estilo =
                                    r.tipo === "vencida"
                                        ? "bg-red-50 border-red-200 text-red-800"
                                        : r.tipo === "por-vencer"
                                        ? "bg-amber-50 border-amber-200 text-amber-800"
                                        : "bg-blue-50 border-blue-200 text-blue-800";

                                return (
                                    <div
                                        key={r.id}
                                        className={`p-2.5 rounded-lg border text-xs font-medium flex items-start gap-2.5 ${estilo}`}
                                    >
                                        {r.categoria === "pedido" ? (
                                            <FaShoppingBag className="shrink-0 text-sm mt-0.5" />
                                        ) : r.categoria === "cita" ? (
                                            <FaCalendarAlt className="shrink-0 text-sm mt-0.5" />
                                        ) : (
                                            <FaSyringe className="shrink-0 text-sm mt-0.5" />
                                        )}
                                        <span className="leading-snug">{r.mensaje}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Navbar({ onAbrirMenu }) {
    const { userData, userRole } = useAuth();
    const esCliente = userRole === "Cliente";
    const esPersonal = userRole === "Administrador" || userRole === "Recepcionista";
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
        <header className="z-10 flex min-h-16 shrink-0 items-center justify-between gap-2 bg-white px-3 shadow sm:px-6 lg:px-8 print:hidden">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <button
                    type="button"
                    onClick={onAbrirMenu}
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
                {esCliente ? (
                    <CampanaCliente />
                ) : esPersonal ? (
                    <CampanaPersonal />
                ) : (
                    <FaBell className="cursor-pointer text-xl" />
                )}

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
