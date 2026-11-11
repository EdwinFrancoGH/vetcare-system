export const METODOS_PAGO_CITA = ["Efectivo", "Tarjeta", "Transferencia"];

export const ETIQUETAS_PAGO_CITA = {
    pendiente: "Pendiente",
    reportado: "Reportado para revisión",
    en_revision: "En revisión",
    aprobado: "Aprobado",
    rechazado: "Rechazado",
    anulado: "Anulado",
};

export function tieneTarifaCita(cita) {
    return Number.isSafeInteger(cita?.precioCentavos)
        && cita.precioCentavos > 0
        && cita.moneda === "USD"
        && typeof cita.servicioId === "string"
        && Boolean(cita.servicioId.trim())
        && typeof cita.servicioNombre === "string"
        && Boolean(cita.servicioNombre.trim());
}

export function puedeReportarPagoCita(pago) {
    return !pago || pago.estado === "pendiente" || pago.estado === "rechazado";
}

export function formatearMontoCita(centavos) {
    if (!Number.isSafeInteger(centavos) || centavos < 0) return "Importe no disponible";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(centavos / 100);
}

export function crearPayloadReportePago(metodoPago, referencia) {
    if (!METODOS_PAGO_CITA.includes(metodoPago)) throw new Error("Selecciona un método de pago válido.");
    const referenciaLimpia = referencia.trim();
    if (referenciaLimpia.length > 200) throw new Error("La referencia no puede superar 200 caracteres.");
    return referenciaLimpia ? { metodoPago, referencia: referenciaLimpia } : { metodoPago };
}

export async function ejecutarUnaVez(bloqueos, clave, accion) {
    if (bloqueos.has(clave)) return false;
    bloqueos.add(clave);
    try {
        await accion();
        return true;
    } finally {
        bloqueos.delete(clave);
    }
}
