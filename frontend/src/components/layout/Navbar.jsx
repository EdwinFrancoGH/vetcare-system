"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    FaBell,
    FaUserCircle,
    FaBars,
    FaCalendarAlt,
    FaSyringe,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import useRecordatoriosCliente from "../../hooks/useRecordatoriosCliente";

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
                                        {r.tipo === "cita" ? (
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

    const displayName = userData?.name || "Usuario VetCare";
    const displayRole = userData?.role || "";
    const esCliente = userRole === "Cliente";

    return (
        <header className="h-16 bg-white shadow flex items-center justify-between px-4 md:px-8 print:hidden">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onAbrirMenu}
                    className="md:hidden text-gray-700 hover:text-blue-900 p-2 rounded-lg hover:bg-gray-100 transition"
                    aria-label="Abrir menú"
                    title="Abrir menú"
                >
                    <FaBars className="text-xl" />
                </button>
                <h1 className="text-xl font-semibold text-gray-700">
                    Sistema Veterinario
                </h1>
            </div>

            <div className="flex items-center gap-6 text-gray-600">
                {esCliente ? (
                    <CampanaCliente />
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
                    <div className="text-sm text-left leading-tight">
                        <p className="font-semibold">{displayName}</p>
                        {displayRole && <p className="text-xs text-gray-400">{displayRole}</p>}
                    </div>
                </Link>
            </div>
        </header>
    );

}
