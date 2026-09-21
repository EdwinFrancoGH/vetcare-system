"use client";

import { useState } from "react";
import DisponibilidadCitas from "../../components/citas/DisponibilidadCitas";
import HorarioAtencionForm from "../../components/citas/HorarioAtencionForm";
import ProximasConsultas from "../../components/citas/ProximasConsultas";
import HistorialCitas from "../../components/citas/HistorialCitas";

// Módulo de Citas con dos vistas, ya que hoy el proyecto no tiene login
// ni roles todavía (ver context/AuthContext.jsx):
// - "Cliente" (dueño de mascota): ve los horarios disponibles (calculados
//   a partir del horario semanal del médico) y reserva.
// - "Médico": configura su horario semanal de atención y ve sus próximas
//   consultas.
export default function CitasPage() {

    const [vista, setVista] = useState("cliente");
    const [filtroVeterinario, setFiltroVeterinario] = useState("");

    // Se incrementa cada vez que algo puede haber movido una cita entre
    // "Mis Próximas Consultas" y "Historial de Citas" (nuevo horario
    // publicado, o una cita confirmada/completada/cancelada), para que
    // ambas listas se vuelvan a cargar.
    const [versionCitas, setVersionCitas] = useState(0);
    const refrescarCitas = () => setVersionCitas((n) => n + 1);

    return (
        <div>

            <div className="flex justify-between items-center mb-6">

                <h1 className="text-4xl font-bold text-gray-900">
                    Citas
                </h1>

                <div className="flex bg-white rounded-lg shadow overflow-hidden">

                    <button
                        onClick={() => setVista("cliente")}
                        className={`px-5 py-2 font-medium ${
                            vista === "cliente"
                                ? "bg-blue-700 text-white"
                                : "text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                        Vista Cliente
                    </button>

                    <button
                        onClick={() => setVista("medico")}
                        className={`px-5 py-2 font-medium ${
                            vista === "medico"
                                ? "bg-blue-700 text-white"
                                : "text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                        Vista Médico
                    </button>

                </div>

            </div>

            {vista === "cliente" && <DisponibilidadCitas />}

            {vista === "medico" && (
                <div>

                    <div className="bg-white rounded-xl shadow p-4 mb-6 flex items-center gap-3">
                        <label className="font-medium text-gray-700">
                            Veterinario:
                        </label>
                        <input
                            type="text"
                            value={filtroVeterinario}
                            onChange={(e) => setFiltroVeterinario(e.target.value)}
                            placeholder="Escribe tu nombre (ej. Dra. Pérez)"
                            className="border rounded-lg px-3 py-2 text-gray-600 flex-1 max-w-xs"
                        />
                    </div>

                    <HorarioAtencionForm
                        veterinario={filtroVeterinario}
                        onSuccess={refrescarCitas}
                    />

                    <ProximasConsultas
                        key={versionCitas}
                        veterinario={filtroVeterinario}
                        onCambio={refrescarCitas}
                    />

                    <HistorialCitas
                        veterinario={filtroVeterinario}
                        refrescar={versionCitas}
                    />

                </div>
            )}

        </div>
    );

}
