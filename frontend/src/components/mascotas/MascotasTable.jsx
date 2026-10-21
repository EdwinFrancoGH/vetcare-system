"use client";

import MascotaRow from "./MascotaRow";

export default function MascotasTable({ mascotas, onEditar, onEliminar, mostrarFicha = true }) {
    return (
        <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="min-w-full">
                <thead className="bg-blue-900 text-white">
                    <tr>
                        <th className="p-4 text-left">Nombre</th>
                        <th className="p-4 text-left">Especie</th>
                        <th className="p-4 text-left">Raza</th>
                        <th className="p-4 text-left">Sexo</th>
                        <th className="p-4 text-left">Edad</th>
                        <th className="p-4 text-center">Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    {mascotas.length === 0 && (
                        <tr>
                            <td colSpan={6} className="p-6 text-center text-gray-500">
                                No hay mascotas registradas todavía.
                            </td>
                        </tr>
                    )}
                    {mascotas.map((mascota) => (
                        <MascotaRow
                            key={mascota.id}
                            mascota={mascota}
                            onEditar={onEditar}
                            onEliminar={onEliminar}
                            mostrarFicha={mostrarFicha}
                        />
                    ))}
                </tbody>
            </table>
        </div>
    );
}