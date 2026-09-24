"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import DisponibilidadCitas from "../../../components/citas/DisponibilidadCitas";
import HorarioAtencionForm from "../../../components/citas/HorarioAtencionForm";
import ProximasConsultas from "../../../components/citas/ProximasConsultas";
import HistorialCitas from "../../../components/citas/HistorialCitas";

// Módulo de Citas con dos vistas:
// - "Cliente" (dueño de mascota): ve los horarios disponibles (calculados
//   a partir del horario semanal del médico) y reserva.
// - "Médico": configura su horario semanal de atención y ve sus próximas
//   consultas.
//
// Ahora que el proyecto sí tiene login y roles (ver
// context/AuthContext.jsx), la vista ya no se elige a mano con un botón
// para todo el mundo: cada quien ve solo lo que le corresponde según su
// rol, y el backend (ver backend/src/routes/citas.routes.js) también
// rechaza las peticiones de "Vista Médico" si no eres personal clínico.
// - Cliente: siempre "Vista Cliente", sin selector.
// - Veterinario: siempre "Vista Médico", con su propio nombre (el de su
//   cuenta) precargado y sin poder escribir el de otro médico.
// - Administrador / Recepcionista: mantienen el selector, porque el
//   personal de recepción coordina la agenda de varios médicos a la vez.
export default function CitasPage() {

    const { userRole, userData } = useAuth();
    const puedeElegirVista = userRole === "Administrador" || userRole === "Recepcionista";
    const vistaForzada = userRole === "Veterinario" ? "medico" : userRole === "Cliente" ? "cliente" : null;

    const [vista, setVista] = useState(vistaForzada || "cliente");
    const [filtroVeterinario, setFiltroVeterinario] = useState("");

    // Si el rol no permite elegir vista, se fuerza (por si el rol tarda
    // en cargar, o cambia). Y si es Veterinario, su propio nombre se usa
    // siempre como filtro: sus citas y su horario, no los de otro médico.
    useEffect(() => {
        if (vistaForzada) {
            setVista(vistaForzada);
        }
    }, [vistaForzada]);

    useEffect(() => {
        if (userRole === "Veterinario") {
            setFiltroVeterinario(userData?.name || "");
        }
    }, [userRole, userData]);

    // Se incrementa cada vez que algo puede haber movido una cita entre
    // "Mis Próximas Consultas" y "Historial de Citas" (nuevo horario
    // publicado, o una cita confirmada/completada/cancelada), para que
    // ambas listas se vuelvan a cargar.
    const [versionCitas, setVersionCitas] = useState(0);
    const refrescarCitas = () => setVersionCitas((n) => n + 1);

    const esVistaMedico = vistaForzada ? vistaForzada === "medico" : vista === "medico";
    const esVistaCliente = vistaForzada ? vistaForzada === "cliente" : vista === "cliente";
    const esVeterinario = userRole === "Veterinario";

    return (
        <div>

            <div className="flex justify-between items-center mb-6">

                <h1 className="text-4xl font-bold text-gray-900">
                    Citas
                </h1>

                {puedeElegirVista && (
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
                )}

            </div>

            {esVistaCliente && <DisponibilidadCitas />}

            {esVistaMedico && (
                <div>

                    <div className="bg-white rounded-xl shadow p-4 mb-6 flex items-center gap-3">
                        <label className="font-medium text-gray-700">
                            Veterinario:
                        </label>
                        {esVeterinario ? (
                            <span className="border rounded-lg px-3 py-2 text-gray-700 bg-gray-50 flex-1 max-w-xs">
                                {filtroVeterinario || "Sin nombre configurado en tu perfil"}
                            </span>
                        ) : (
                            <input
                                type="text"
                                value={filtroVeterinario}
                                onChange={(e) => setFiltroVeterinario(e.target.value)}
                                placeholder="Escribe el nombre del médico (ej. Dra. Pérez)"
                                className="border rounded-lg px-3 py-2 text-gray-600 flex-1 max-w-xs"
                            />
                        )}
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
