"use client";

import Link from "next/link";
import { FaCalendarAlt, FaPlus } from "react-icons/fa";
import { formatearFechaLarga } from "../../../utils/citas";

export default function BienvenidaCliente({ nombreUsuario, primeraCitaProxima }) {
    return (
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white rounded-2xl shadow-lg p-6 sm:p-8">
            <h1 className="text-3xl sm:text-4xl font-bold">
                Hola{nombreUsuario ? `, ${nombreUsuario}` : ""}
            </h1>
            <p className="mt-2 text-blue-100 text-base sm:text-lg max-w-2xl">
                {primeraCitaProxima
                    ? `Tu próxima cita es el ${formatearFechaLarga(primeraCitaProxima.fecha)} a las ${primeraCitaProxima.hora} con ${primeraCitaProxima.veterinario}.`
                    : "No tienes citas programadas. ¿Quieres agendar una?"}
            </p>

            <div className="flex flex-wrap gap-3 mt-6">
                <Link
                    href="/mascotas"
                    className="flex items-center gap-2 bg-white text-blue-900 hover:bg-blue-50 font-medium px-4 py-2.5 rounded-lg shadow-sm transition text-sm"
                >
                    <FaPlus className="text-xs" /> Registrar / gestionar mascotas
                </Link>
                <Link
                    href="/citas"
                    className="flex items-center gap-2 border border-white text-white hover:bg-white/10 font-medium px-4 py-2.5 rounded-lg transition text-sm"
                >
                    <FaCalendarAlt className="text-xs" /> Agendar una cita
                </Link>
            </div>
        </div>
    );
}
