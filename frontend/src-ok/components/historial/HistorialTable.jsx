"use client";

import HistorialRow from "./HistorialRow";

export default function HistorialTable({ historiales, mascotas, onVerFicha, onEditar, onEliminar }) {

    // Resuelve el nombre de la mascota a partir de su mascotaId
    function nombreMascota(mascotaId) {
        const mascota = mascotas.find((m) => m.id === mascotaId);
        return mascota ? mascota.nombre : "—";
    }

    return (
        <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="min-w-full">
                <thead className="bg-blue-900 text-white">
                    <tr>
                        <th className="p-4 text-left">Mascota</th>
                        <th className="p-4 text-left">Fecha</th>
                        <th className="p-4 text-left">Motivo</th>
                        <th className="p-4 text-left">Diagnóstico</th>
                        <th className="p-4 text-left">Próxima cita</th>
                        <th className="p-4 text-center">Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    {historiales.map((historial) => (
                        <HistorialRow
                            key={historial.id}
                            historial={historial}
                            nombreMascota={nombreMascota(historial.mascotaId)}
                            onVerFicha={onVerFicha}
                            onEditar={onEditar}
                            onEliminar={onEliminar}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
