"use client";

import Link from "next/link";
import { FaPaw } from "react-icons/fa";
import { obtenerEspecie } from "../../../utils/especies";
import { formatearEdad } from "../../../utils/citas";
import BotonAgregarCalendar from "../../ui/BotonAgregarCalendar";

export default function MisMascotasResumen({ mascotas = [], getProximaVacunaMascota }) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Mis mascotas</h2>
                {mascotas.length > 0 && (
                    <Link
                        href="/mascotas"
                        className="text-sm font-semibold text-blue-700 hover:text-blue-900 transition"
                    >
                        Ver todas ({mascotas.length}) &rarr;
                    </Link>
                )}
            </div>

            {mascotas.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
                        <FaPaw className="text-3xl" />
                    </div>
                    <p className="text-gray-700 font-semibold text-lg mb-1">
                        Aún no has registrado mascotas
                    </p>
                    <p className="text-gray-500 text-sm mb-4">
                        Registra a tu mascota para llevar el control de sus vacunas, citas e historial.
                    </p>
                    <Link
                        href="/mascotas"
                        className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-5 py-2.5 rounded-lg shadow transition"
                    >
                        Registrar mi primera mascota
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mascotas.map((m) => {
                        const espConfig = obtenerEspecie(m.especie);
                        const IconoEsp = espConfig.icon;
                        const pv = getProximaVacunaMascota(m.id);
                        const inicial = m.nombre ? m.nombre.charAt(0).toUpperCase() : "?";

                        return (
                            <div
                                key={m.id}
                                className="bg-white rounded-xl shadow p-5 flex flex-col justify-between hover:shadow-md transition border border-gray-100"
                            >
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 border ${espConfig.bg}`}
                                        >
                                            <span>{inicial}</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="font-bold text-gray-900 truncate text-base">
                                                    {m.nombre}
                                                </h3>
                                                <span className="text-gray-400">
                                                    <IconoEsp className="text-sm" />
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">
                                                {m.especie} · {m.raza}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {formatearEdad(m.fechaNacimiento, m.edad)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-2.5 mb-4 text-xs flex items-center justify-between gap-2">
                                        <p className={pv.clase}>{pv.texto}</p>
                                        {pv.vacuna && !pv.esVencida && (
                                            <BotonAgregarCalendar
                                                titulo={`Vacuna ${pv.vacuna.nombre} de ${m.nombre}`}
                                                fecha={pv.vacuna.proximaFecha}
                                                detalles={`Próxima dosis de la vacuna ${pv.vacuna.nombre} para ${m.nombre}.`}
                                                className="text-xs text-blue-700 hover:text-blue-900 hover:underline shrink-0 font-medium whitespace-nowrap"
                                            >
                                                Agregar a calendario
                                            </BotonAgregarCalendar>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 text-xs font-semibold">
                                    <Link
                                        href={`/mascotas/${m.id}`}
                                        className="text-blue-700 hover:text-blue-900 hover:underline py-1"
                                    >
                                        Ver ficha &rarr;
                                    </Link>
                                    <Link
                                        href="/citas"
                                        className="text-gray-600 hover:text-blue-700 py-1"
                                    >
                                        Agendar cita
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
