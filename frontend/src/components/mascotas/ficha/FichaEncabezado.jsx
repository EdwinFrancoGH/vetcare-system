"use client";

import Link from "next/link";
import { FaCalendarAlt, FaEdit, FaMars, FaVenus } from "react-icons/fa";
import { obtenerEspecie } from "../../../utils/especies";
import { formatearEdad } from "../../../utils/citas";

const COLOR_ESTADO_CLINICO = {
    "Crítico": "bg-red-100 text-red-800",
    "En seguimiento": "bg-orange-100 text-orange-800",
    "Estable": "bg-green-100 text-green-800",
    "Sin historial": "bg-gray-100 text-gray-600",
};

export default function FichaEncabezado({ mascota, esCliente, estadoClinico, onEditar }) {
    const espConfig = obtenerEspecie(mascota.especie);
    const IconoEspecie = espConfig.icon;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:p-0 print:border-b print:pb-4 print:rounded-none">
            <div className={`h-3 w-full ${espConfig.stripBg || "bg-blue-500"} print:hidden`} />

            <div className="p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                    <div
                        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center font-bold text-3xl shrink-0 overflow-hidden border-2 ${espConfig.bg} shadow-inner transition`}
                    >
                        {mascota.fotoURL ? (
                            <img src={mascota.fotoURL} alt={`Foto de ${mascota.nombre}`} className="h-full w-full object-cover" />
                        ) : (
                            <IconoEspecie className="w-10 h-10 sm:w-12 sm:h-12" />
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 truncate">
                            {mascota.nombre}
                        </h1>
                        <p className="text-sm sm:text-base text-gray-500 font-medium truncate mt-0.5">
                            {mascota.especie} · {mascota.raza}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                {mascota.sexo === "Macho" ? (
                                    <FaMars className="text-blue-500" />
                                ) : (
                                    <FaVenus className="text-pink-500" />
                                )}
                                {mascota.sexo || "Sexo —"}
                            </span>

                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                {formatearEdad(mascota.fechaNacimiento, mascota.edad)}
                            </span>

                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                {mascota.color || "Color no esp."}
                            </span>

                            <span
                                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                    mascota.estado === "Inactivo"
                                        ? "bg-gray-100 text-gray-600"
                                        : "bg-blue-100 text-blue-800"
                                }`}
                            >
                                {mascota.estado || "Activo"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0 print:hidden">
                    {esCliente ? (
                        <>
                            <Link
                                href="/citas"
                                className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm"
                            >
                                <FaCalendarAlt className="text-xs" />
                                <span>Agendar cita</span>
                            </Link>

                            <button
                                type="button"
                                onClick={onEditar}
                                className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm"
                            >
                                <FaEdit className="text-xs text-gray-500" />
                                <span>Editar</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <span
                                title="Estado clínico calculado a partir de pendientes vencidos y próximos"
                                className={`px-3.5 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                                    COLOR_ESTADO_CLINICO[estadoClinico] || "bg-gray-100 text-gray-600"
                                }`}
                            >
                                Estado clínico: {estadoClinico}
                            </span>

                            <button
                                type="button"
                                onClick={onEditar}
                                className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-sm font-semibold px-3 py-1.5 rounded-xl transition shadow-sm"
                            >
                                <FaEdit className="text-xs text-gray-500" />
                                <span>Editar</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
