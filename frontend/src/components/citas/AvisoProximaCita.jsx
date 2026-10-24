"use client";

import Link from "next/link";
import { FaCalendarCheck } from "react-icons/fa";
import { formatearFechaLarga } from "../../utils/citas";

export default function AvisoProximaCita({ proximaCita }) {
    if (!proximaCita) return null;

    return (
        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <FaCalendarCheck className="text-xl" />
                </div>
                <div>
                    <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                        Tu próxima cita
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 mt-0.5">
                        {proximaCita.nombreMascota} –{" "}
                        {formatearFechaLarga(proximaCita.fecha)} a las{" "}
                        {proximaCita.hora} con Dr(a).{" "}
                        {proximaCita.veterinario}
                    </p>
                </div>
            </div>
            <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium shadow-sm transition"
            >
                Ver mis citas &rarr;
            </Link>
        </div>
    );
}
