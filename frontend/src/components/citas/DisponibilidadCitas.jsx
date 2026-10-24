"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { obtenerCitasDisponibles, obtenerCitasPorMascota } from "../../services/citas.service";
import { obtenerHorarios } from "../../services/horarios.service";
import { obtenerMascotas } from "../../services/mascotas.service";
import {
    agruparCitasPorFecha,
    esCitaProxima,
    hoyISO,
    horaActualSV,
    inicioDeSemana,
    sumarDiasISO,
} from "../../utils/citas";
import { useAuth } from "../../context/AuthContext";
import ReservarCitaModal from "./ReservarCitaModal";
import AvisoProximaCita from "./AvisoProximaCita";
import SelectorMedico from "./SelectorMedico";
import SelectorDias from "./SelectorDias";
import HorariosDelDia from "./HorariosDelDia";

function mensajeDeError(error) {
    if (!error?.response) {
        return "No se pudo conectar con el servidor. Verifica que el backend esté corriendo.";
    }
    return error.response.data?.message || `El servidor respondió con un error (${error.response.status}).`;
}

export default function DisponibilidadCitas() {
    const { user, userRole } = useAuth();
    const esCliente = !!user && userRole === "Cliente";
    const semanaActual = inicioDeSemana(hoyISO());

    const [veterinarios, setVeterinarios] = useState([]);
    const [veterinarioSeleccionado, setVeterinarioSeleccionado] = useState("");
    const [inicioSemana, setInicioSemana] = useState(semanaActual);
    const [disponibles, setDisponibles] = useState([]);
    const [mascotas, setMascotas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [citaSeleccionada, setCitaSeleccionada] = useState(null);
    const [error, setError] = useState(null);
    const [diaSeleccionado, setDiaSeleccionado] = useState(null);
    const [proximaCitaCliente, setProximaCitaCliente] = useState(null);
    const finSemana = sumarDiasISO(inicioSemana, 6);
    const hoy = hoyISO();
    const [horaSV, setHoraSV] = useState(() => horaActualSV());
    const forzarAutoSeleccionRef = useRef(true);

    useEffect(() => {
        const intervalo = setInterval(() => setHoraSV(horaActualSV()), 60000);
        return () => clearInterval(intervalo);
    }, []);

    useEffect(() => {
        forzarAutoSeleccionRef.current = true;
    }, [inicioSemana, veterinarioSeleccionado]);

    useEffect(() => {
        cargarVeterinariosYMascotas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (veterinarioSeleccionado) cargarDisponibilidad();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [veterinarioSeleccionado, inicioSemana]);

    async function cargarVeterinariosYMascotas() {
        try {
            const [resHorarios, resMascotas] = await Promise.allSettled([
                obtenerHorarios(),
                obtenerMascotas(),
            ]);

            if (resHorarios.status === "rejected") throw resHorarios.reason;
            const nombres = resHorarios.value.data.data.map((h) => h.veterinario);
            setVeterinarios(nombres);

            const misMascotas = resMascotas.status === "fulfilled" ? (resMascotas.value.data.data || []) : [];
            setMascotas(misMascotas);

            if (esCliente && misMascotas.length > 0) {
                try {
                    const citasRes = await Promise.allSettled(
                        misMascotas.map((m) => obtenerCitasPorMascota(m.id))
                    );
                    const todasCitas = citasRes
                        .filter((r) => r.status === "fulfilled")
                        .flatMap((r) => r.value.data?.data || []);

                    const activas = todasCitas
                        .filter(esCitaProxima)
                        .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));

                    if (activas.length > 0) {
                        const primera = activas[0];
                        const nombreMascota = misMascotas.find((m) => m.id === primera.mascotaId)?.nombre || "tu mascota";
                        setProximaCitaCliente({ ...primera, nombreMascota });
                    } else {
                        setProximaCitaCliente(null);
                    }
                } catch (citasErr) {
                    console.error("Error al cargar citas del cliente:", citasErr);
                }
            }

            if (nombres.length > 0) {
                setVeterinarioSeleccionado((prev) => prev || nombres[0]);
            } else {
                setCargando(false);
            }
        } catch (err) {
            console.error("Error al cargar médicos disponibles:", err);
            setError(mensajeDeError(err));
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
            setDisponibles(respuesta.data.data || []);
        } catch (err) {
            console.error("Error al cargar la disponibilidad de citas:", err);
            setError(mensajeDeError(err));
            setDisponibles([]);
        } finally {
            setCargando(false);
        }
    }

    const disponiblesValidas = useMemo(() => {
        return disponibles.filter((c) => {
            if (c.fecha < hoy) return false;
            if (c.fecha === hoy && c.hora <= horaSV) return false;
            return true;
        });
    }, [disponibles, hoy, horaSV]);

    const diasDeLaSemana = useMemo(() => {
        const porFecha = new Map(agruparCitasPorFecha(disponiblesValidas).map((g) => [g.fecha, g.citas]));
        return Array.from({ length: 7 }, (_, i) => {
            const fecha = sumarDiasISO(inicioSemana, i);
            const citas = porFecha.get(fecha) || [];
            return { fecha, citas, esPasado: fecha < hoy, libres: citas.length };
        });
    }, [disponiblesValidas, inicioSemana, hoy]);

    useEffect(() => {
        if (cargando || diasDeLaSemana.length === 0) return;

        const diaEsValido =
            Boolean(diaSeleccionado) &&
            diaSeleccionado >= inicioSemana &&
            diaSeleccionado <= finSemana &&
            diaSeleccionado >= hoy;

        if (forzarAutoSeleccionRef.current || !diaEsValido) {
            forzarAutoSeleccionRef.current = false;
            const primerConHorarios = diasDeLaSemana.find((d) => !d.esPasado && d.libres > 0);
            if (primerConHorarios) {
                setDiaSeleccionado(primerConHorarios.fecha);
            } else {
                const primerNoPasado = diasDeLaSemana.find((d) => !d.esPasado) || diasDeLaSemana[0];
                if (primerNoPasado) setDiaSeleccionado(primerNoPasado.fecha);
            }
        }
    }, [cargando, diasDeLaSemana, diaSeleccionado, inicioSemana, finSemana, hoy]);

    const esSemanaActual = inicioSemana <= semanaActual;
    const infoDiaSeleccionado = useMemo(() => {
        return diasDeLaSemana.find((d) => d.fecha === diaSeleccionado) || {
            fecha: diaSeleccionado,
            citas: [],
            esPasado: false,
            libres: 0,
        };
    }, [diasDeLaSemana, diaSeleccionado]);

    const duracionCita = disponibles[0]?.duracionMinutos || 30;

    return (
        <div>
            {esCliente && proximaCitaCliente && <AvisoProximaCita proximaCita={proximaCitaCliente} />}

            <div className="mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">Disponibilidad de Horarios</h2>
                    <p className="mt-1 text-gray-600">Elige un horario disponible para agendar la consulta de tu mascota.</p>
                    <p className="mt-1 text-xs text-gray-500">Los horarios se muestran en hora de El Salvador. La cita dura aprox. {duracionCita} min.</p>
                </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 mb-6">{error}</div>}

            {!error && veterinarios.length === 0 && !cargando && (
                <div className="bg-white rounded-xl shadow p-6 text-gray-500">
                    Todavía no hay médicos con horario de atención configurado.
                </div>
            )}

            {!error && veterinarios.length > 0 && (
                <>
                    <SelectorMedico
                        veterinarios={veterinarios}
                        veterinarioSeleccionado={veterinarioSeleccionado}
                        onSeleccionar={setVeterinarioSeleccionado}
                    />
                    <SelectorDias
                        inicioSemana={inicioSemana}
                        finSemana={finSemana}
                        esSemanaActual={esSemanaActual}
                        onSemanaAnterior={() => setInicioSemana(sumarDiasISO(inicioSemana, -7))}
                        onSemanaSiguiente={() => setInicioSemana(sumarDiasISO(inicioSemana, 7))}
                        onIrAHoy={() => setInicioSemana(semanaActual)}
                        diasDeLaSemana={diasDeLaSemana}
                        diaSeleccionado={diaSeleccionado}
                        onSeleccionarDia={setDiaSeleccionado}
                    />
                    {cargando ? (
                        <p className="text-gray-500 py-6 text-center">Cargando disponibilidad...</p>
                    ) : (
                        <HorariosDelDia
                            fecha={infoDiaSeleccionado.fecha}
                            citas={infoDiaSeleccionado.citas}
                            onSeleccionarCita={setCitaSeleccionada}
                        />
                    )}
                </>
            )}

            {citaSeleccionada && (
                <ReservarCitaModal
                    cita={citaSeleccionada}
                    mascotas={mascotas}
                    onClose={() => setCitaSeleccionada(null)}
                    onSuccess={() => {
                        cargarDisponibilidad();
                        cargarVeterinariosYMascotas();
                    }}
                />
            )}
        </div>
    );
}
