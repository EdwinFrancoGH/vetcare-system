"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { obtenerCitasPorMascota, obtenerPagoCita, reportarPagoCita } from "../../services/citas.service";
import { obtenerMascotas } from "../../services/mascotas.service";
import {
    crearPayloadReportePago,
    ETIQUETAS_PAGO_CITA,
    ejecutarUnaVez,
    formatearMontoCita,
    METODOS_PAGO_CITA,
    puedeReportarPagoCita,
    tieneTarifaCita,
} from "../../utils/pagoCita";

const mensajeError = (error) => error.response?.data?.message
    || "No se pudo completar la operación. Inténtalo nuevamente.";

export default function PagosCitasCliente({ uid }) {
    const [citas, setCitas] = useState([]);
    const [pagos, setPagos] = useState({});
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [formularios, setFormularios] = useState({});
    const [enviando, setEnviando] = useState({});
    const bloqueos = useRef(new Set());

    const cargar = useCallback(async () => {
        if (!uid) return;
        setCargando(true);
        setError("");
        try {
            const mascotasResponse = await obtenerMascotas();
            const mascotas = mascotasResponse.data?.data || [];
            const listas = await Promise.all(mascotas.map((mascota) => obtenerCitasPorMascota(mascota.id)));
            const citasCliente = listas.flatMap((respuesta) => respuesta.data?.data || [])
                .filter((cita) => cita.estado === "completada")
                .map((cita) => ({ ...cita, nombreMascota: mascotas.find((m) => m.id === cita.mascotaId)?.nombre || "Mascota" }))
                .sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`));
            setCitas(citasCliente);

            const elegibles = citasCliente.filter(tieneTarifaCita);
            const resultados = await Promise.all(elegibles.map(async (cita) => {
                const respuesta = await obtenerPagoCita(cita.id);
                return [cita.id, respuesta.data?.data || null];
            }));
            setPagos(Object.fromEntries(resultados));
        } catch (err) {
            setError(mensajeError(err));
            setCitas([]);
            setPagos({});
        } finally {
            setCargando(false);
        }
    }, [uid]);

    useEffect(() => {
        const timer = setTimeout(() => { void cargar(); }, 0);
        return () => clearTimeout(timer);
    }, [cargar]);

    const actualizarFormulario = (id, cambios) => setFormularios((actual) => ({
        ...actual,
        [id]: { metodoPago: "Efectivo", referencia: "", ...actual[id], ...cambios },
    }));

    const enviar = async (cita) => {
        await ejecutarUnaVez(bloqueos.current, cita.id, async () => {
            setEnviando((actual) => ({ ...actual, [cita.id]: true }));
            const form = formularios[cita.id] || { metodoPago: "Efectivo", referencia: "" };
            try {
                const payload = crearPayloadReportePago(form.metodoPago, form.referencia || "");
                const respuesta = await reportarPagoCita(cita.id, payload);
                setPagos((actual) => ({ ...actual, [cita.id]: respuesta.data?.data || null }));
                actualizarFormulario(cita.id, { error: "", exito: "Reporte enviado. El pago queda pendiente de revisión." });
            } catch (err) {
                actualizarFormulario(cita.id, { error: mensajeError(err), exito: "" });
                if (err.response?.status === 409) {
                    try {
                        const actual = await obtenerPagoCita(cita.id);
                        setPagos((pagosActuales) => ({ ...pagosActuales, [cita.id]: actual.data?.data || null }));
                    } catch { /* Se conserva el formulario para permitir corregir/reintentar. */ }
                }
            } finally {
                setEnviando((actual) => ({ ...actual, [cita.id]: false }));
            }
        });
    };

    return (
        <section className="mt-8" aria-labelledby="pagos-citas-titulo">
            <h2 id="pagos-citas-titulo" className="mb-3 text-xl font-bold text-gray-900">Pagos de citas</h2>
            {cargando ? <p className="text-gray-500">Cargando pagos de citas...</p> : null}
            {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}<button className="ml-3 font-semibold underline" onClick={cargar}>Reintentar</button></div> : null}
            {!cargando && !error && citas.length === 0 ? <p className="rounded-xl bg-white p-5 text-gray-600">No hay citas completadas para mostrar.</p> : null}
            <div className="space-y-4">
                {citas.map((cita) => {
                    const pago = pagos[cita.id];
                    const formulario = formularios[cita.id] || { metodoPago: "Efectivo", referencia: "" };
                    const tieneTarifa = tieneTarifaCita(cita);
                    const etiqueta = pago ? ETIQUETAS_PAGO_CITA[pago.estado] || pago.estado : "Sin reporte";
                    const monto = pago?.montoCentavos ?? cita.precioCentavos;
                    return (
                        <article key={cita.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{cita.servicioNombre || "Servicio veterinario"} · {cita.nombreMascota}</h3>
                                    <p className="text-sm text-gray-600">Cita del {cita.fecha} a las {cita.hora}</p>
                                    {tieneTarifa ? <p className="mt-1 font-semibold text-gray-800">{formatearMontoCita(monto)}</p> : <p className="mt-1 text-sm text-gray-600">Servicio y tarifa pendientes de asignación. Esta cita histórica sigue disponible.</p>}
                                </div>
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">Pago: {etiqueta}</span>
                            </div>
                            {pago?.metodoPago ? <p className="mt-2 text-sm text-gray-600">Método reportado: {pago.metodoPago}</p> : null}
                            {pago?.estado === "rechazado" && pago.motivoRechazo ? <p className="mt-2 text-sm text-red-700">Motivo: {pago.motivoRechazo}</p> : null}
                            {formulario.error ? <p role="alert" className="mt-3 text-sm text-red-700">{formulario.error}</p> : null}
                            {formulario.exito ? <p role="status" className="mt-3 text-sm text-green-700">{formulario.exito}</p> : null}
                            {tieneTarifa && puedeReportarPagoCita(pago) ? (
                                <div className="mt-4 border-t border-gray-100 pt-4">
                                    <p className="mb-3 text-sm text-gray-600">Registra el método utilizado. El reporte queda sujeto a verificación; no confirma que el pago haya sido aprobado.</p>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="text-sm font-medium text-gray-700">Método de pago
                                            <select className="mt-1 block w-full rounded-lg border border-gray-300 p-2" value={formulario.metodoPago} onChange={(event) => actualizarFormulario(cita.id, { metodoPago: event.target.value })}>
                                                {METODOS_PAGO_CITA.map((metodo) => <option key={metodo} value={metodo}>{metodo}</option>)}
                                            </select>
                                        </label>
                                        <label className="text-sm font-medium text-gray-700">Referencia (opcional)
                                            <input maxLength={200} className="mt-1 block w-full rounded-lg border border-gray-300 p-2" value={formulario.referencia || ""} onChange={(event) => actualizarFormulario(cita.id, { referencia: event.target.value })} />
                                        </label>
                                    </div>
                                    <button disabled={Boolean(enviando[cita.id])} onClick={() => enviar(cita)} className="mt-3 rounded-lg bg-blue-700 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">
                                        {enviando[cita.id] ? "Enviando..." : pago?.estado === "rechazado" ? "Volver a reportar" : "Reportar pago"}
                                    </button>
                                </div>
                            ) : null}
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
