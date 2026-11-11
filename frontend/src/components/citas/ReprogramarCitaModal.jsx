"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { FaCalendarAlt, FaClock, FaTimes } from "react-icons/fa";
import { obtenerCitasDisponibles, reprogramarCita } from "../../services/citas.service";
import { obtenerHorarios } from "../../services/horarios.service";
import {
    agruparCitasPorFecha,
    formatearFechaLarga,
    horaActualSV,
    hoyISO,
    inicioDeSemana,
    sumarDiasISO,
} from "../../utils/citas";
import SelectorMedico from "./SelectorMedico";
import SelectorDias from "./SelectorDias";
import HorariosDelDia from "./HorariosDelDia";

function mensajeDeError(error) {
    if (error.response?.status === 409) {
        return "Ese horario dejó de estar disponible. Actualizamos las opciones; selecciona otro horario.";
    }
    return error.response?.data?.message || "No se pudo cargar la disponibilidad. Inténtalo de nuevo.";
}

export default function ReprogramarCitaModal({ cita, onClose, onSuccess }) {
    const hoy = hoyISO();
    const [veterinarios, setVeterinarios] = useState([]);
    const [veterinarioSeleccionado, setVeterinarioSeleccionado] = useState(cita.veterinario || "");
    const [inicioSemana, setInicioSemana] = useState(() => inicioDeSemana(cita.fecha < hoy ? hoy : cita.fecha));
    const [resultadoDisponibilidad, setResultadoDisponibilidad] = useState({ clave: "", datos: [], error: "" });
    const [diaSeleccionado, setDiaSeleccionado] = useState("");
    const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);
    const [cargandoVeterinarios, setCargandoVeterinarios] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [errorVeterinarios, setErrorVeterinarios] = useState("");
    const [errorOperacion, setErrorOperacion] = useState("");
    const envioEnCurso = useRef(false);
    const finSemana = sumarDiasISO(inicioSemana, 6);
    const horaActual = horaActualSV();
    const claveDisponibilidad = `${veterinarioSeleccionado}|${inicioSemana}|${finSemana}`;
    const cargandoDisponibilidad = Boolean(veterinarioSeleccionado) && resultadoDisponibilidad.clave !== claveDisponibilidad;
    const disponibles = useMemo(
        () => resultadoDisponibilidad.clave === claveDisponibilidad ? resultadoDisponibilidad.datos : [],
        [resultadoDisponibilidad, claveDisponibilidad]
    );
    const errorDisponibilidad = resultadoDisponibilidad.clave === claveDisponibilidad ? resultadoDisponibilidad.error : "";
    const error = errorOperacion || errorVeterinarios || errorDisponibilidad;

    useEffect(() => {
        let activa = true;
        obtenerHorarios()
            .then((respuesta) => {
                if (!activa) return;
                const nombres = (respuesta.data.data || [])
                    .map((horario) => horario.veterinario)
                    .filter(Boolean);
                setVeterinarios(nombres);
                setErrorVeterinarios(nombres.length ? "" : "No hay veterinarios con horario configurado.");
                setVeterinarioSeleccionado((actual) => {
                    if (nombres.includes(cita.veterinario)) return cita.veterinario;
                    return nombres.includes(actual) ? actual : nombres[0] || "";
                });
            })
            .catch((requestError) => {
                if (activa) setErrorVeterinarios(mensajeDeError(requestError));
            })
            .finally(() => {
                if (activa) setCargandoVeterinarios(false);
            });
        return () => { activa = false; };
    }, [cita.veterinario]);

    useEffect(() => {
        if (!veterinarioSeleccionado) return undefined;
        let activa = true;
        obtenerCitasDisponibles({
            veterinario: veterinarioSeleccionado,
            desde: inicioSemana,
            hasta: finSemana,
        })
            .then((respuesta) => {
                if (!activa) return;
                const datos = respuesta.data.data || [];
                setResultadoDisponibilidad({ clave: claveDisponibilidad, datos, error: "" });
                setHorarioSeleccionado(null);
                const futuras = datos.filter((horario) =>
                    horario.fecha > hoy || (horario.fecha === hoy && horario.hora > horaActual)
                );
                const fechasConDisponibilidad = new Set(futuras.map((horario) => horario.fecha));
                const fechasSemana = Array.from({ length: 7 }, (_, indice) => sumarDiasISO(inicioSemana, indice));
                setDiaSeleccionado(
                    fechasSemana.find((fecha) => fechasConDisponibilidad.has(fecha))
                    || fechasSemana.find((fecha) => fecha >= hoy)
                    || ""
                );
            })
            .catch((requestError) => {
                if (!activa) return;
                setResultadoDisponibilidad({ clave: claveDisponibilidad, datos: [], error: mensajeDeError(requestError) });
            });
        return () => { activa = false; };
    }, [veterinarioSeleccionado, inicioSemana, finSemana, claveDisponibilidad, hoy, horaActual]);

    const disponiblesFuturos = useMemo(() => disponibles.filter((horario) =>
        horario.fecha > hoy || (horario.fecha === hoy && horario.hora > horaActual)
    ), [disponibles, hoy, horaActual]);

    const diasDeLaSemana = useMemo(() => {
        const porFecha = new Map(agruparCitasPorFecha(disponiblesFuturos).map((grupo) => [grupo.fecha, grupo.citas]));
        return Array.from({ length: 7 }, (_, indice) => {
            const fecha = sumarDiasISO(inicioSemana, indice);
            const citas = porFecha.get(fecha) || [];
            return { fecha, citas, esPasado: fecha < hoy, libres: citas.length };
        });
    }, [disponiblesFuturos, inicioSemana, hoy]);

    const infoDia = diasDeLaSemana.find((dia) => dia.fecha === diaSeleccionado) || {
        fecha: diaSeleccionado,
        citas: [],
        esPasado: false,
        libres: 0,
    };

    function cambiarVeterinario(nombre) {
        setErrorOperacion("");
        setHorarioSeleccionado(null);
        setDiaSeleccionado("");
        setVeterinarioSeleccionado(nombre);
    }

    function cambiarSemana(inicio) {
        setErrorOperacion("");
        setHorarioSeleccionado(null);
        setDiaSeleccionado("");
        setInicioSemana(inicio);
    }

    async function confirmarReprogramacion() {
        if (!horarioSeleccionado || envioEnCurso.current) return;
        envioEnCurso.current = true;
        setEnviando(true);
        setErrorOperacion("");
        try {
            await reprogramarCita(cita.id, {
                veterinario: horarioSeleccionado.veterinario,
                fecha: horarioSeleccionado.fecha,
                hora: horarioSeleccionado.hora,
            });
            await Swal.fire({
                icon: "success",
                title: "Cita reprogramada",
                text: `Nueva fecha: ${formatearFechaLarga(horarioSeleccionado.fecha)} a las ${horarioSeleccionado.hora}.`,
                confirmButtonColor: "#1d4ed8",
            });
            await onSuccess();
            onClose();
        } catch (requestError) {
            const mensaje = mensajeDeError(requestError);
            setErrorOperacion(mensaje);
            if (requestError.response?.status === 409) {
                setHorarioSeleccionado(null);
                try {
                    const respuesta = await obtenerCitasDisponibles({
                        veterinario: veterinarioSeleccionado,
                        desde: inicioSemana,
                        hasta: finSemana,
                    });
                    setResultadoDisponibilidad({ clave: claveDisponibilidad, datos: respuesta.data.data || [], error: "" });
                } catch {
                    // Se mantiene el mensaje del conflicto inicial y la reserva no se modifica.
                }
            }
            await Swal.fire({
                icon: "error",
                title: requestError.response?.status === 409 ? "Horario no disponible" : "No se pudo reprogramar",
                text: requestError.response?.data?.message || mensaje,
                confirmButtonColor: "#1d4ed8",
            });
        } finally {
            envioEnCurso.current = false;
            setEnviando(false);
        }
    }

    const esSemanaActual = inicioSemana <= inicioDeSemana(hoy);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <section role="dialog" aria-modal="true" aria-labelledby="titulo-reprogramar" className="w-full max-w-4xl rounded-2xl bg-gray-50 shadow-2xl overflow-hidden my-auto">
                <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 sm:px-6">
                    <div>
                        <h2 id="titulo-reprogramar" className="text-xl font-bold text-gray-900">Reprogramar cita</h2>
                        <p className="mt-1 text-sm text-gray-600">
                            Cita actual: {formatearFechaLarga(cita.fecha)} a las {cita.hora} · Dr(a). {cita.veterinario}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} disabled={enviando} aria-label="Cerrar" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50">
                        <FaTimes />
                    </button>
                </div>

                <div className="max-h-[75vh] overflow-y-auto p-4 sm:p-6">
                    {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
                    {cargandoVeterinarios ? (
                        <p className="py-6 text-center text-gray-500">Cargando veterinarios...</p>
                    ) : veterinarios.length > 0 ? (
                        <>
                            <SelectorMedico
                                veterinarios={veterinarios}
                                veterinarioSeleccionado={veterinarioSeleccionado}
                                onSeleccionar={cambiarVeterinario}
                            />
                            <SelectorDias
                                inicioSemana={inicioSemana}
                                finSemana={finSemana}
                                esSemanaActual={esSemanaActual}
                                onSemanaAnterior={() => cambiarSemana(sumarDiasISO(inicioSemana, -7))}
                                onSemanaSiguiente={() => cambiarSemana(sumarDiasISO(inicioSemana, 7))}
                                onIrAHoy={() => cambiarSemana(inicioDeSemana(hoy))}
                                diasDeLaSemana={diasDeLaSemana}
                                diaSeleccionado={diaSeleccionado}
                                onSeleccionarDia={setDiaSeleccionado}
                            />
                            {cargandoDisponibilidad ? (
                                <p className="py-6 text-center text-gray-500">Cargando disponibilidad...</p>
                            ) : (
                                <HorariosDelDia
                                    fecha={infoDia.fecha}
                                    citas={infoDia.citas}
                                    onSeleccionarCita={setHorarioSeleccionado}
                                />
                            )}
                            {horarioSeleccionado && (
                                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-900">
                                    <FaCalendarAlt />
                                    <span>{formatearFechaLarga(horarioSeleccionado.fecha)}</span>
                                    <FaClock className="ml-2" />
                                    <span>{horarioSeleccionado.hora}</span>
                                    <span>· Dr(a). {horarioSeleccionado.veterinario}</span>
                                </div>
                            )}
                        </>
                    ) : (
                        !error && <p className="rounded-xl bg-white p-6 text-gray-600">No hay veterinarios con horarios configurados.</p>
                    )}
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-100 bg-white px-5 py-4 sm:px-6">
                    <button type="button" onClick={onClose} disabled={enviando} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50">Cerrar</button>
                    <button type="button" onClick={confirmarReprogramacion} disabled={!horarioSeleccionado || enviando || cargandoDisponibilidad} className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
                        {enviando ? "Reprogramando..." : "Confirmar reprogramación"}
                    </button>
                </div>
            </section>
        </div>
    );
}
