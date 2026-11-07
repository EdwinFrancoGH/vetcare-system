export const METODOS_PAGO_CITA = new Set(["Efectivo", "Tarjeta", "Transferencia"]);
const CAMPOS_PERMITIDOS = new Set(["metodoPago", "referencia"]);

export const validarReportePagoCita = (datos) => {
    if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
        return "El cuerpo de la solicitud debe ser un objeto.";
    }
    const desconocido = Object.keys(datos).find((campo) => !CAMPOS_PERMITIDOS.has(campo));
    if (desconocido) return `El campo '${desconocido}' no está permitido.`;
    if (typeof datos.metodoPago !== "string" || !METODOS_PAGO_CITA.has(datos.metodoPago)) {
        return "El método de pago debe ser Efectivo, Tarjeta o Transferencia.";
    }
    if (datos.referencia !== undefined
        && (typeof datos.referencia !== "string" || datos.referencia.trim().length > 200)) {
        return "La referencia debe ser texto de hasta 200 caracteres.";
    }
    return null;
};

export const normalizarReportePagoCita = (datos) => ({
    metodoPago: datos.metodoPago,
    referencia: typeof datos.referencia === "string" && datos.referencia.trim()
        ? datos.referencia.trim()
        : null,
});
