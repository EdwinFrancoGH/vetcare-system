"use client";

import { useEffect, useMemo, useState } from "react";
import { obtenerCitasDisponibles } from "../../services/citas.service";
import { obtenerHorarios } from "../../services/horarios.service";
import { obtenerMascotas } from "../../services/mascotas.service";
import {
    agruparCitasPorFecha,
    formatearFechaLarga,
    hoyISO,
    inicioDeSemana,
    sumarDiasISO,
} from "../../utils/citas";
import ReservarCitaModal from "./ReservarCitaModal";

// Distingue un backend caído / URL mal configurada (sin respuesta) de un
// error que el servidor sí respondió (401, 403, 500...), para no culpar
// siempre a la conexión.
function mensajeDeError(error) {
    if (!error?.response) {
        return "No se pudo conectar con el servidor. Verifica que el backend esté corriendo.";
    }

    return (
        error.response.data?.message ||
        `El servidor respondió con un error (${error.response.status}).`
    );
}

// Vista Cliente (dueño de mascota): muestra, semana por semana, los
// horarios disponibles de un veterinario (calculados a partir de su
// horario semanal de atención) para que el usuario elija uno y lo
// reserve. Si una semana está completamente ocupada, el cliente avanza
// a la siguiente con el botón "Semana siguiente".
export default function DisponibilidadCitas() {

    const semanaActual = inicioDeSemana(hoyISO());

    const [veterinarios, setVeterinarios] = useState([]);
    const [veterinarioSeleccionado, setVeterinarioSeleccionado] = useState("");
    const [inicioSemana, setInicioSemana] = useState(semanaActual);
    const [disponibles, setDisponibles] = useState([]);
    const [mascotas, setMascotas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [citaSeleccionada, setCitaSeleccionada] = useState(null);
    const [error, setError] = useState(null);

    const finSemana = sumarDiasISO(inicioSemana, 6);

    useEffect(() => {
        cargarVeterinariosYMascotas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (veterinarioSeleccionado) {
            cargarDisponibilidad();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [veterinarioSeleccionado, inicioSemana]);

    async function cargarVeterinariosYMascotas() {

        try {

            // allSettled: si falla la carga de mascotas, igual se muestran
            // los horarios disponibles. Antes, con Promise.all, cualquier
            // error de /mascotas (como el 403 que recibía un Cliente) tumbaba
            // toda la vista con el mensaje engañoso de "no se pudo conectar".
            const [resHorarios, resMascotas] = await Promise.allSettled([
                obtenerHorarios(),
                obtenerMascotas(),
            ]);

            if (resHorarios.status === "rejected") {
                throw resHorarios.reason;
            }

            const nombres = resHorarios.value.data.data.map((h) => h.veterinario);

            setVeterinarios(nombres);

            if (resMascotas.status === "fulfilled") {
                setMascotas(resMascotas.value.data.data);
            } else {
                console.error("Error al cargar mascotas:", resMascotas.reason);
                setMascotas([]);
            }

            if (nombres.length > 0) {
                setVeterinarioSeleccionado(nombres[0]);
            } else {
                setCargando(false);
            }

        } catch (error) {

            console.error("Error al cargar médicos disponibles:", error);
            setError(mensajeDeError(error));
            setCargando(false);

        }

    }

    async function cargarDisponibilidad() {

        try {

            setCargando(true);
            setError(null);

            const respuesta = await obtenerCitasDisponibles({
                veterinario: veterinarioSeleccionado,
                desde: inicioSemana,
                hasta: finSemana,
            });

            setDisponibles(respuesta.data.data);

        } catch (error) {

            console.error("Error al cargar la disponibilidad de citas:", error);
            setError(mensajeDeError(error));
            setDisponibles([]);

        } finally {

            setCargando(false);

        }

    }

    const diasDeLaSemana = useMemo(() => {

        const grupos = agruparCitasPorFecha(disponibles);
        const porFecha = new Map(grupos.map((g) => [g.fecha, g.citas]));

        return Array.from({ length: 7 }, (_, i) => {
            const fecha = sumarDiasISO(inicioSemana, i);
            return { fecha, citas: porFecha.get(fecha) || [] };
        });

    }, [disponibles, inicioSemana]);

    const esSemanaActual = inicioSemana <= semanaActual;

    return (
        <div>

            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">

                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Disponibilidad de Horarios
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Elige un horario disponible para agendar la consulta de tu mascota.
                    </p>
                </div>

                {veterinarios.length > 0 && (
                    <div>
                        <label className="block mb-1 text-sm font-medium text-gray-700">
                            Médico
                        </label>
                        <select
                            value={veterinarioSeleccionado}
                            onChange={(e) => setVeterinarioSeleccionado(e.target.value)}
                            className="border rounded-lg px-3 py-2 text-gray-700"
                        >
                            {veterinarios.map((nombre) => (
                                <option key={nombre} value={nombre}>
                                    Dr(a). {nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 mb-6">
                    {error}
                </div>
            )}

            {!error && veterinarios.length === 0 && !cargando && (
                <div className="bg-white rounded-xl shadow p-6 text-gray-500">
                    Todavía no hay médicos con horario de atención configurado.
                </div>
            )}

            {!error && veterinarios.length > 0 && (
                <>
                    <div className="flex items-center justify-between bg-white rounded-xl shadow p-4 mb-6">

                        <button
                            onClick={() => setInicioSemana(sumarDiasISO(inicioSemana, -7))}
                            disabled={esSemanaActual}
                            className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100"
                        >
                            &larr; Semana anterior
                        </button>

                        <p className="font-semibold text-gray-800 capitalize text-center">
                            {formatearFechaLarga(inicioSemana)} — {formatearFechaLarga(finSemana)}
                        </p>

                        <button
                            onClick={() => setInicioSemana(sumarDiasISO(inicioSemana, 7))}
                            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
                        >
                            Semana siguiente &rarr;
                        </button>

                    </div>

                    {cargando ? (
                        <p className="text-gray-500">Cargando disponibilidad...</p>
                    ) : (
                        <div className="space-y-4">
                            {diasDeLaSemana.map(({ fecha, citas }) => (
                                <div key={fecha} className="bg-white rounded-xl shadow p-6">

                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 capitalize">
                                        {formatearFechaLarga(fecha)}
                                    </h3>

                                    {citas.length === 0 ? (
                                        <p className="text-gray-400 text-sm">
                                            Sin horarios disponibles este día.
                                        </p>
                                    ) : (
                                        <div className="flex flex-wrap gap-3">
                                            {citas.map((cita) => (
                                                <button
                                                    key={`${cita.fecha}_${cita.hora}`}
                                                    onClick={() => setCitaSeleccionada(cita)}
                                                    className="border border-blue-700 text-blue-700 rounded-lg px-4 py-2 hover:bg-blue-700 hover:text-white transition text-sm font-medium"
                                                >
                                                    {cita.hora}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {citaSeleccionada && (
                <ReservarCitaModal
                    cita={citaSeleccionada}
                    mascotas={mascotas}
                    onClose={() => setCitaSeleccionada(null)}
                    onSuccess={cargarDisponibilidad}
                />
            )}

        </div>
    );

}
