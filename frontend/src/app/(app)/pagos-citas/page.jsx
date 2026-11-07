"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FaCheck, FaClock, FaExclamationCircle, FaMoneyBillWave, FaTimes } from "react-icons/fa";
import RequireRole from "../../../components/auth/RequireRole";
import {
    aprobarPagoCita,
    consultarDetallePagoCita,
    obtenerPagosPendientes,
    rechazarPagoCita,
} from "../../../services/pagos-citas.service";
import {
    crearPayloadRechazoPago,
    etiquetaEventoPago,
    ejecutarDecisionPago,
    etiquetaEstadoPago,
    extraerListaPagos,
    extraerPagoDetalle,
    formatearFechaPago,
    formatearImportePago,
    mensajeErrorPago,
    puedeDecidirPago,
    ROLES_REVISORES_PAGOS,
} from "../../../utils/pagosCitasAdmin";

export default function PagosCitasPage() {
    return (
        <RequireRole roles={ROLES_REVISORES_PAGOS}>
            <PanelRevisionPagos />
        </RequireRole>
    );
}

function PanelRevisionPagos() {
    const [pagos, setPagos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [actualizando, setActualizando] = useState(false);
    const [error, setError] = useState("");
    const [aviso, setAviso] = useState("");
    const [detalleBase, setDetalleBase] = useState(null);
    const [detalle, setDetalle] = useState(null);
    const [cargandoDetalle, setCargandoDetalle] = useState(false);
    const [errorDetalle, setErrorDetalle] = useState("");
    const [rechazo, setRechazo] = useState(null);
    const [motivo, setMotivo] = useState("");
    const [errorMotivo, setErrorMotivo] = useState("");
    const [procesandoId, setProcesandoId] = useState(null);
    const bloqueos = useRef(new Set());

    const cargarLista = useCallback(async (recarga = false) => {
        if (recarga) setActualizando(true);
        else setCargando(true);
        setError("");
        try {
            const respuesta = await obtenerPagosPendientes();
            setPagos(extraerListaPagos(respuesta));
        } catch (err) {
            setError(mensajeErrorPago(err));
        } finally {
            setCargando(false);
            setActualizando(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => { void cargarLista(); }, 0);
        return () => clearTimeout(timer);
    }, [cargarLista]);

    const cargarDetalle = async (pago) => {
        setDetalleBase(pago);
        setDetalle(null);
        setErrorDetalle("");
        setCargandoDetalle(true);
        try {
            const respuesta = await consultarDetallePagoCita(pago.citaId);
            const data = extraerPagoDetalle(respuesta);
            if (!data) throw new Error("El servidor no devolvió el detalle del pago.");
            setDetalle(data);
        } catch (err) {
            setErrorDetalle(mensajeErrorPago(err));
        } finally {
            setCargandoDetalle(false);
        }
    };

    const actualizarTrasDecision = async (pago) => {
        await cargarLista(true);
        if (detalleBase?.citaId === pago.citaId) await cargarDetalle(pago);
    };

    const aprobar = async (pago) => {
        if (!puedeDecidirPago(pago) || !window.confirm(`¿Aprobar el pago de ${formatearImportePago(pago.montoCentavos, pago.moneda)} para la cita ${pago.citaId}?`)) return;
        setAviso("");
        setError("");
        try {
            const ejecutada = await ejecutarDecisionPago({
                pago,
                decision: "aprobar",
                bloqueos: bloqueos.current,
                servicio: { aprobar: aprobarPagoCita, rechazar: rechazarPagoCita },
                actualizar: () => actualizarTrasDecision(pago),
                iniciar: () => setProcesandoId(pago.citaId),
                finalizar: () => setProcesandoId(null),
            });
            if (ejecutada) setAviso(`El pago de la cita ${pago.citaId} fue aprobado.`);
        } catch (err) {
            const mensaje = mensajeErrorPago(err);
            if (err.response?.status === 409) setAviso(mensaje);
            else setError(mensaje);
        }
    };

    const abrirRechazo = (pago) => {
        if (!puedeDecidirPago(pago)) return;
        setRechazo(pago);
        setMotivo("");
        setErrorMotivo("");
        setError("");
    };

    const confirmarRechazo = async (event) => {
        event.preventDefault();
        if (!rechazo || !puedeDecidirPago(rechazo)) return;
        let payload;
        try {
            payload = crearPayloadRechazoPago(motivo);
            setErrorMotivo("");
        } catch (err) {
            setErrorMotivo(err.message);
            return;
        }

        const pago = rechazo;
        setError("");
        setAviso("");
        try {
            const ejecutada = await ejecutarDecisionPago({
                pago,
                decision: "rechazar",
                motivo: payload.motivoRechazo,
                bloqueos: bloqueos.current,
                servicio: { aprobar: aprobarPagoCita, rechazar: rechazarPagoCita },
                actualizar: () => actualizarTrasDecision(pago),
                iniciar: () => setProcesandoId(pago.citaId),
                finalizar: () => setProcesandoId(null),
            });
            if (ejecutada) {
                setRechazo(null);
                setAviso(`El pago de la cita ${pago.citaId} fue rechazado.`);
            }
        } catch (err) {
            const mensaje = mensajeErrorPago(err);
            if (err.response?.status === 409) {
                setRechazo(null);
                setAviso(mensaje);
            } else setError(mensaje);
        }
    };

    return (
        <main className="space-y-6 pb-16">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <FaMoneyBillWave className="text-blue-700" size={23} />
                        <h1 className="text-2xl font-bold text-zinc-900">Revisión de pagos veterinarios</h1>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">Pagos reportados para citas veterinarias que esperan revisión.</p>
                </div>
                <button type="button" onClick={() => cargarLista(true)} disabled={actualizando || cargando} className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60">
                    {actualizando ? "Actualizando..." : "Actualizar listado"}
                </button>
            </header>

            {aviso ? <div role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">{aviso}</div> : null}
            {error ? <div role="alert" className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><FaExclamationCircle />{error}<button type="button" onClick={() => cargarLista(true)} className="ml-auto font-semibold underline">Reintentar</button></div> : null}

            {cargando ? (
                <div className="flex flex-col items-center justify-center rounded-xl bg-white py-20 text-zinc-500">
                    <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    <p>Cargando pagos pendientes...</p>
                </div>
            ) : !error && pagos.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-12 text-center text-zinc-500">
                    <FaCheck className="mx-auto mb-3 text-green-600" size={32} />
                    <p className="font-semibold text-zinc-800">No hay pagos pendientes de revisión.</p>
                </div>
            ) : !error ? (
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-blue-900 text-left text-white">
                                <tr>
                                    <th className="px-4 py-3">Pago / cita</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Servicio</th><th className="px-4 py-3">Importe</th><th className="px-4 py-3">Método / referencia</th><th className="px-4 py-3">Reporte</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagos.map((pago) => (
                                    <tr key={pago.id} className="border-t border-zinc-100 align-top text-zinc-700">
                                        <td className="px-4 py-4"><div className="font-medium text-zinc-900">{pago.id}</div><div className="mt-1 text-xs text-zinc-500">Cita: {pago.citaId}</div></td>
                                        <td className="px-4 py-4"><div className="font-medium text-zinc-900">{pago.cliente?.nombre || "Cliente"}</div><div className="text-xs text-zinc-500">{pago.cliente?.email || pago.cliente?.uid || "Identidad no disponible"}</div></td>
                                        <td className="px-4 py-4">{pago.servicio?.nombre || "Servicio no disponible"}</td>
                                        <td className="whitespace-nowrap px-4 py-4 font-semibold">{formatearImportePago(pago.montoCentavos, pago.moneda)}</td>
                                        <td className="px-4 py-4"><div>{pago.metodoPago || "—"}</div><div className="max-w-40 break-words text-xs text-zinc-500">{pago.referencia || "Sin referencia"}</div></td>
                                        <td className="whitespace-nowrap px-4 py-4">{formatearFechaPago(pago.reportadoAt)}</td>
                                        <td className="px-4 py-4"><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{etiquetaEstadoPago(pago.estado)}</span></td>
                                        <td className="min-w-48 px-4 py-4">
                                            <button type="button" className="mb-2 block font-semibold text-blue-700 hover:underline" onClick={() => cargarDetalle(pago)}>Ver detalle e historial</button>
                                            {puedeDecidirPago(pago) ? <div className="flex flex-wrap gap-2">
                                                <button type="button" disabled={procesandoId === pago.citaId} onClick={() => aprobar(pago)} className="rounded-md bg-green-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">{procesandoId === pago.citaId ? "Procesando..." : "Aprobar"}</button>
                                                <button type="button" disabled={procesandoId === pago.citaId} onClick={() => abrirRechazo(pago)} className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">Rechazar</button>
                                            </div> : <span className="text-xs text-zinc-400">Sin acciones disponibles</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}

            {detalleBase ? <DetallePagoModal
                base={detalleBase}
                detalle={detalle}
                cargando={cargandoDetalle}
                error={errorDetalle}
                onRetry={() => cargarDetalle(detalleBase)}
                onClose={() => { setDetalleBase(null); setDetalle(null); setErrorDetalle(""); }}
            /> : null}

            {rechazo ? <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && procesandoId !== rechazo.citaId) setRechazo(null); }}>
                <form onSubmit={confirmarRechazo} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="rechazo-titulo">
                    <div className="flex items-start justify-between gap-3">
                        <div><h2 id="rechazo-titulo" className="text-xl font-bold text-zinc-900">Rechazar pago</h2><p className="mt-1 text-sm text-zinc-600">Cita {rechazo.citaId} · {formatearImportePago(rechazo.montoCentavos, rechazo.moneda)}</p></div>
                        <button type="button" aria-label="Cerrar" disabled={procesandoId === rechazo.citaId} onClick={() => setRechazo(null)} className="rounded p-1 text-zinc-500 hover:bg-zinc-100"><FaTimes /></button>
                    </div>
                    <label className="mt-5 block text-sm font-semibold text-zinc-700" htmlFor="motivo-rechazo">Motivo del rechazo</label>
                    <textarea id="motivo-rechazo" value={motivo} onChange={(event) => { setMotivo(event.target.value); setErrorMotivo(""); setError(""); }} maxLength={500} rows={4} disabled={procesandoId === rechazo.citaId} className="mt-2 w-full rounded-lg border border-zinc-300 p-3 text-sm focus:border-blue-500 focus:outline-none" placeholder="Describe por qué no se puede aprobar este pago." />
                    <div className="mt-1 flex justify-between text-xs text-zinc-500"><span>Se requiere un motivo de 3 a 500 caracteres.</span><span>{motivo.trim().length}/500</span></div>
                    {errorMotivo ? <p role="alert" className="mt-2 text-sm text-red-700">{errorMotivo}</p> : null}
                    {error ? <p role="alert" className="mt-2 text-sm text-red-700">{error}</p> : null}
                    <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Se registrará este motivo en el historial. El cliente podrá reportar nuevamente después.</p>
                    <div className="mt-5 flex justify-end gap-3">
                        <button type="button" disabled={procesandoId === rechazo.citaId} onClick={() => setRechazo(null)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700">Volver</button>
                        <button type="submit" disabled={procesandoId === rechazo.citaId} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{procesandoId === rechazo.citaId ? "Procesando..." : "Confirmar rechazo"}</button>
                    </div>
                </form>
            </div> : null}
        </main>
    );
}

function DetallePagoModal({ base, detalle, cargando, error, onRetry, onClose }) {
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
            <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl" role="dialog" aria-modal="true" aria-labelledby="detalle-pago-titulo">
                <header className="sticky top-0 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
                    <div><h2 id="detalle-pago-titulo" className="text-xl font-bold text-zinc-900">Detalle e historial del pago</h2><p className="text-sm text-zinc-500">Pago {base.id} · Cita {base.citaId}</p></div>
                    <button type="button" onClick={onClose} aria-label="Cerrar detalle" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"><FaTimes /></button>
                </header>
                <div className="space-y-5 p-6">
                    {cargando ? <div className="py-12 text-center text-zinc-500"><FaClock className="mx-auto mb-3 animate-pulse" size={24} />Cargando detalle e historial...</div> : null}
                    {error ? <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}<button type="button" onClick={onRetry} className="ml-3 font-semibold underline">Reintentar</button></div> : null}
                    {detalle ? <>
                        <div className="grid gap-3 rounded-xl bg-zinc-50 p-4 sm:grid-cols-2">
                            <Dato etiqueta="Cliente" valor={base.cliente?.nombre || "Cliente"} />
                            <Dato etiqueta="Correo" valor={base.cliente?.email || "No disponible"} />
                            <Dato etiqueta="Servicio" valor={detalle.servicioNombre || base.servicio?.nombre || "No disponible"} />
                            <Dato etiqueta="Importe histórico" valor={formatearImportePago(detalle.montoCentavos, detalle.moneda)} />
                            <Dato etiqueta="Método" valor={detalle.metodoPago || "No disponible"} />
                            <Dato etiqueta="Referencia" valor={detalle.referencia || "Sin referencia"} />
                            <Dato etiqueta="Estado actual" valor={etiquetaEstadoPago(detalle.estado)} />
                            <Dato etiqueta="Reportado" valor={formatearFechaPago(detalle.reportadoAt)} />
                            <Dato etiqueta="Verificado" valor={detalle.verificadoAt ? formatearFechaPago(detalle.verificadoAt) : "Sin verificar"} />
                            <Dato etiqueta="Verificador" valor={detalle.verificadorUid ? `${detalle.verificadorUid} (${detalle.verificadorRol || "rol no informado"})` : "Sin verificación"} />
                            {detalle.motivoRechazo ? <Dato etiqueta="Motivo de rechazo" valor={detalle.motivoRechazo} /> : null}
                        </div>
                        <section>
                            <h3 className="mb-3 flex items-center gap-2 font-bold text-zinc-900"><FaClock className="text-blue-700" />Historial de intentos y decisiones</h3>
                            {Array.isArray(detalle.historial) && detalle.historial.length ? (
                                <ol className="space-y-3">
                                    {detalle.historial.map((evento, index) => <li key={evento.id || `${evento.createdAt}-${evento.tipo}-${index}`} className="rounded-xl border border-zinc-200 p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-2"><div className="font-semibold text-zinc-900">{etiquetaEventoPago(evento)}</div><time className="text-xs text-zinc-500">{formatearFechaPago(evento.createdAt)}</time></div>
                                        <div className="mt-2 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2">
                                            <span>Estado: {etiquetaEstadoPago(evento.estado)}</span>
                                            {evento.intento ? <span>Intento: {evento.intento}</span> : null}
                                            {evento.metodoPago ? <span>Método: {evento.metodoPago}</span> : null}
                                            {evento.montoCentavos !== undefined ? <span>Importe: {formatearImportePago(evento.montoCentavos, evento.moneda)}</span> : null}
                                            {evento.referencia ? <span>Referencia: {evento.referencia}</span> : null}
                                            {evento.actorUid ? <span>Actor: {evento.actorUid}{evento.actorRol ? ` (${evento.actorRol})` : ""}</span> : null}
                                            {evento.motivoRechazo ? <span className="sm:col-span-2">Motivo: {evento.motivoRechazo}</span> : null}
                                        </div>
                                    </li>)}
                                </ol>
                            ) : <p className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-500">El Backend no devolvió eventos históricos para este pago.</p>}
                        </section>
                    </> : null}
                </div>
            </section>
        </div>
    );
}

function Dato({ etiqueta, valor }) {
    return <div className="min-w-0"><div className="text-xs font-medium text-zinc-500">{etiqueta}</div><div className="break-words text-sm font-semibold text-zinc-800">{valor}</div></div>;
}
