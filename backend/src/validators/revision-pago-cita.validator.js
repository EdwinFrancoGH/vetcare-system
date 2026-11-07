const esObjeto = (valor) => valor !== null && typeof valor === "object" && !Array.isArray(valor);

export const validarIdCitaPago = (id) =>
    typeof id === "string" && id.trim().length > 0 && id.length <= 128 && !id.includes("/")
        ? null
        : "El identificador de la cita no es válido.";

export const validarAprobacionPago = (datos) => {
    if (datos === undefined) return null;
    if (!esObjeto(datos)) return "El cuerpo de la solicitud debe ser un objeto.";
    if (Object.keys(datos).length > 0) return "La aprobación no acepta campos enviados por el cliente.";
    return null;
};

export const validarRechazoPago = (datos) => {
    if (!esObjeto(datos)) return "El cuerpo de la solicitud debe ser un objeto.";
    const campoDesconocido = Object.keys(datos).find((campo) => campo !== "motivoRechazo");
    if (campoDesconocido) return `El campo '${campoDesconocido}' no está permitido.`;
    if (typeof datos.motivoRechazo !== "string") return "El motivo de rechazo es obligatorio.";
    const motivo = datos.motivoRechazo.trim();
    if (motivo.length < 3 || motivo.length > 500) {
        return "El motivo de rechazo debe tener entre 3 y 500 caracteres.";
    }
    return null;
};
