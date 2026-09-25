"use client";

import Link from "next/link";

export default function MascotaRow({ mascota, onEditar, onEliminar, mostrarFicha = true }) {

    return (
        <tr className="border-b hover:bg-gray-50 text-gray-900">

            <td className="p-4">{mascota.nombre}</td>

            <td className="p-4">{mascota.especie}</td>

            <td className="p-4">{mascota.raza}</td>

            <td className="p-4">{mascota.sexo}</td>

            <td className="p-4">{mascota.edad}</td>

            <td className="p-4 text-center">

            {/* La ficha clínica usa historiales/vacunas, que son solo del personal */}
            {mostrarFicha && (
                <Link
                    href={`/mascotas/${mascota.id}`}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded inline-block mr-2"
                >
                    Ver ficha
                </Link>
            )}

            <button
                onClick={() => onEditar(mascota)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded mr-2"
            >
                Editar
            </button>

            <button
                onClick={() => onEliminar(mascota.id)}
                
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                
            >
                Eliminar
            </button>
            </td>

        </tr>
    );

}