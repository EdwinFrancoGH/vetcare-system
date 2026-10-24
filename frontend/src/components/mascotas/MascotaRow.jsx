"use client";

import Link from "next/link";
import { formatearEdad } from "../../utils/citas";

export default function MascotaRow({ mascota, onEditar, onEliminar, mostrarFicha = true }) {

    return (
        <tr className="border-b hover:bg-gray-50 text-gray-900">

            <td className="p-4 font-medium">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                        {mascota.fotoURL ? (
                            <img src={mascota.fotoURL} alt={`Foto de ${mascota.nombre}`} className="h-full w-full object-cover" />
                        ) : (
                            (mascota.nombre || "?").charAt(0).toUpperCase()
                        )}
                    </div>
                    <span>{mascota.nombre}</span>
                    {mascota.estado === "Inactivo" && (
                        <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full font-normal border border-gray-300">
                            Inactivo
                        </span>
                    )}
                    {mascota.estado === "En tratamiento" && (
                        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-normal border border-amber-200">
                            En tratamiento
                        </span>
                    )}
                </div>
            </td>

            <td className="p-4 text-gray-700">{mascota.propietario || "—"}</td>

            <td className="p-4">{mascota.especie}</td>

            <td className="p-4">{mascota.raza}</td>

            <td className="p-4">{mascota.sexo}</td>

            <td className="p-4">{formatearEdad(mascota.fechaNacimiento, mascota.edad)}</td>

            <td className="p-4 text-center">

            {/* Enlace a la ficha de la mascota */}
            {mostrarFicha && (
                <Link
                    href={`/mascotas/${mascota.id}`}
                    aria-label="Ver ficha"
                    title="Ver ficha"
                    className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded inline-block mr-2"
                >
                    Ver ficha
                </Link>
            )}

            <button
                onClick={() => onEditar(mascota)}
                aria-label="Editar mascota"
                title="Editar mascota"
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded mr-2"
            >
                Editar
            </button>

            <button
                onClick={() => onEliminar(mascota.id)}
                aria-label="Eliminar mascota"
                title="Eliminar mascota"
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
            >
                Eliminar
            </button>
            </td>

        </tr>
    );

}
