"use client";

export default function VacunaRow({ vacuna, nombreMascota, onEditar, onEliminar }) {

    return (
        <tr className="border-b hover:bg-gray-50 text-gray-900">

            <td className="p-4">{nombreMascota}</td>

            <td className="p-4">{vacuna.nombre}</td>

            <td className="p-4">{vacuna.fecha}</td>

            <td className="p-4">{vacuna.proximaFecha || "—"}</td>

            <td className="p-4 text-center">

            <button
                onClick={() => onEditar(vacuna)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
            >
                Editar
            </button>

            <button
                onClick={() => onEliminar(vacuna.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded ml-2"
            >
                Eliminar
            </button>
            </td>

        </tr>
    );

}
