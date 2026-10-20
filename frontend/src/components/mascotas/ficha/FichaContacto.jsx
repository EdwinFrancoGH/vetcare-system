"use client";

import { FaUser, FaPhone, FaBirthdayCake, FaMapMarkerAlt } from "react-icons/fa";
import { formatearFechaCorta } from "../../../utils/citas";

export default function FichaContacto({ mascota }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm print:hidden">
            <div className="flex items-center gap-3 min-w-[180px]">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                    <FaUser className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Propietario</p>
                    <p className="font-semibold text-gray-800 truncate">{mascota.propietario || "—"}</p>
                </div>
            </div>

            <div className="flex items-center gap-3 min-w-[180px]">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                    <FaPhone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Teléfono</p>
                    <p className="font-semibold text-gray-800">{mascota.telefono || "—"}</p>
                </div>
            </div>

            <div className="flex items-center gap-3 min-w-[180px]">
                <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                    <FaBirthdayCake className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] text-gray-400 uppercase font-semibold">Fecha de nacimiento</p>
                    <p className="font-semibold text-gray-800">
                        {mascota.fechaNacimiento ? formatearFechaCorta(mascota.fechaNacimiento) : "—"}
                    </p>
                </div>
            </div>

            {mascota.direccion && (
                <div className="flex items-center gap-3 min-w-[180px]">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                        <FaMapMarkerAlt className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] text-gray-400 uppercase font-semibold">Dirección</p>
                        <p className="font-semibold text-gray-800 truncate">{mascota.direccion}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
