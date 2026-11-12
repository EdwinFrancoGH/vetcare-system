import { ejecutarUnaVez } from "./pagoCita.js";

export const ESTADOS_PAGO_REVISABLES = ["reportado", "en_revision"];
export const ROLES_REVISORES_PAGOS = ["Administrador", "Recepcionista"];

const ETIQUETAS_ESTADO = {
    pendiente: "Pendiente",
    reportado: "Reportado",
    en_revision: "En revisión",
    aprobado: "Aprobado",
    rechazado: "Rechazado",
    anulado: "Anulado",
};

export const esRolRevisorPagos = (rol) => ROLES_REVISORES_PAGOS.includes(rol);

export const crearServicioPagosCitasWeb = (clienteApi) => ({
    obtenerPendientes: () => clienteApi.get("/pagos/pendientes"),
    obtenerHistorial: () => clienteApi.get("/pagos/historial"),
    consultarDetalle: (citaId) => clienteApi.get(`/citas/${encodeURIComponent(citaId)}/pago`),
    aprobar: (citaId) => clienteApi.patch(`/pagos/${encodeURIComponent(citaId)}/aprobar`, {}),
    rechazar: (citaId, motivoRechazo) => clienteApi.patch(
        `/pagos/${encodeURIComponent(citaId)}/rechazar`,
        { motivoRechazo },
    ),
});

export const puedeDecidirPago = (pago) =>
    Boolean(pago && ESTADOS_PAGO_REVISABLES.includes(pago.estado));

export function crearPayloadRechazoPago(motivoRechazo) {
    if (typeof motivoRechazo !== "string") throw new Error("El motivo de rechazo es obligatorio.");
    const motivo = motivoRechazo.trim();
    if (motivo.length < 3 || motivo.length > 500) {
        throw new Error("El motivo debe tener entre 3 y 500 caracteres.");
    }
    return { motivoRechazo: motivo };
}

export function formatearImportePago(montoCentavos, moneda) {
    if (!Number.isSafeInteger(montoCentavos) || montoCentavos < 0 || moneda !== "USD") {
        return "Importe no disponible";
    }
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(montoCentavos / 100);
}

export const etiquetaEstadoPago = (estado) => ETIQUETAS_ESTADO[estado] || estado || "Estado no disponible";

export const ESTADOS_HISTORIAL_PAGOS = ["aprobado", "rechazado", "anulado"];

const CLASES_ESTADO = {
    aprobado: "bg-green-100 text-green-800",
    rechazado: "bg-red-100 text-red-800",
    anulado: "bg-zinc-200 text-zinc-700",
    reportado: "bg-amber-100 text-amber-800",
    en_revision: "bg-amber-100 text-amber-800",
};

export const claseEstadoPago = (estado) => CLASES_ESTADO[estado] || "bg-zinc-100 text-zinc-700";

const normalizarTexto = (valor) => String(valor || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Filtra el historial por estado ("todos" = sin filtro) y por texto libre
// (cliente, correo, mascota, servicio, referencia o ID de cita).
export function filtrarHistorialPagos(pagos, { estado = "todos", texto = "" } = {}) {
    const lista = Array.isArray(pagos) ? pagos : [];
    const busqueda = normalizarTexto(texto).trim();
    return lista.filter((pago) => {
        if (estado !== "todos" && pago.estado !== estado) return false;
        if (!busqueda) return true;
        return [
            pago.cliente?.nombre, pago.cliente?.email, pago.mascota?.nombre,
            pago.servicio?.nombre, pago.referencia, pago.citaId, pago.metodoPago,
        ].some((campo) => normalizarTexto(campo).includes(busqueda));
    });
}

// Totales del historial: cuántos pagos hay por estado y monto aprobado.
export function resumirHistorialPagos(pagos) {
    const lista = Array.isArray(pagos) ? pagos : [];
    return lista.reduce((resumen, pago) => {
        if (pago.estado === "aprobado") {
            resumen.aprobados += 1;
            if (Number.isSafeInteger(pago.montoCentavos) && pago.moneda === "USD") {
                resumen.totalAprobadoCentavos += pago.montoCentavos;
            }
        } else if (pago.estado === "rechazado") resumen.rechazados += 1;
        return resumen;
    }, { aprobados: 0, rechazados: 0, totalAprobadoCentavos: 0 });
}

export function etiquetaEventoPago(evento) {
    if (evento?.tipo === "reporte") return `Reporte del cliente${evento.intento ? ` · intento ${evento.intento}` : ""}`;
    if (evento?.tipo === "aprobacion") return "Pago aprobado";
    if (evento?.tipo === "rechazo") return "Pago rechazado";
    return evento?.tipo || "Evento de pago";
}

export function formatearFechaPago(fecha) {
    if (typeof fecha !== "string" || !fecha) return "Fecha no disponible";
    const valor = new Date(fecha);
    if (Number.isNaN(valor.getTime())) return fecha;
    return new Intl.DateTimeFormat("es-GT", { dateStyle: "medium", timeStyle: "short" }).format(valor);
}

export function mensajeErrorPago(error) {
    const status = error?.response?.status;
    if (status === 401) return "Tu sesión expiró. Vuelve a iniciar sesión para revisar pagos.";
    if (status === 403) return "Tu cuenta no tiene permiso para revisar pagos.";
    if (status === 409) return error.response?.data?.message || "El pago cambió mientras lo revisabas. Se actualizó la información.";
    return error?.response?.data?.message || "No se pudo completar la operación. Inténtalo nuevamente.";
}

export const extraerListaPagos = (respuesta) =>
    Array.isArray(respuesta?.data?.data) ? respuesta.data.data : [];

export const extraerPagoDetalle = (respuesta) => respuesta?.data?.data || null;

export async function ejecutarDecisionPago({ pago, decision, motivo, bloqueos, servicio, actualizar, iniciar, finalizar }) {
    if (!puedeDecidirPago(pago)) return false;
    return ejecutarUnaVez(bloqueos, pago.citaId, async () => {
        iniciar?.();
        try {
            if (decision === "aprobar") await servicio.aprobar(pago.citaId);
            else if (decision === "rechazar") {
                const payload = crearPayloadRechazoPago(motivo);
                await servicio.rechazar(pago.citaId, payload.motivoRechazo);
            } else throw new Error("Decisión de pago no reconocida.");
            await actualizar();
        } catch (error) {
            await actualizar();
            throw error;
        } finally {
            finalizar?.();
        }
    });
}
