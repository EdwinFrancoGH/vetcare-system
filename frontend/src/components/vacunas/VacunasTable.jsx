"use client";

import VacunaRow from "./VacunaRow";

export default function VacunasTable({ vacunas, mascotas, onEditar, onEliminar }) {

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
                        <th className="p-4 text-left">Vacuna</th>
                        <th className="p-4 text-left">Fecha aplicación</th>
                        <th className="p-4 text-left">Próxima fecha</th>
                        <th className="p-4 text-center">Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    {vacunas.map((vacuna) => (
                        <VacunaRow
                            key={vacuna.id}
                            vacuna={vacuna}
                            nombreMascota={nombreMascota(vacuna.mascotaId)}
                            onEditar={onEditar}
                            onEliminar={onEliminar}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
