"use client";

export default function HistorialRow({ historial, nombreMascota, onVerFicha, onEditar, onEliminar }) {

    // Abre la ficha de la consulta al hacer clic en la fila. Los botones
    // de Editar/Eliminar detienen la propagación para no abrir la ficha
    // por accidente al usarlos.
    function manejarClicFila() {
        if (onVerFicha) {
            onVerFicha(historial);
        }
    }

    return (
        <tr
            onClick={manejarClicFila}
            className="border-b hover:bg-gray-50 text-gray-900 cursor-pointer"
        >

            <td className="p-4">{nombreMascota}</td>

            <td className="p-4">{historial.fecha}</td>

            <td className="p-4">{historial.motivoConsulta}</td>

            <td className="p-4">{historial.diagnostico}</td>

            <td className="p-4">{historial.proximaCita || "—"}</td>

            <td className="p-4 text-center">

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onEditar(historial);
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
            >
                Editar
            </button>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onEliminar(historial.id);
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded ml-2"
            >
                Eliminar
            </button>
            </td>

        </tr>
    );

}
