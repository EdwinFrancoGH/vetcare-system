// Formateadores de fecha y hora para pedidos en zona horaria de El Salvador

const formatoFecha = new Intl.DateTimeFormat("es-SV", {
    timeZone: "America/El_Salvador",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
});

const formatoHora = new Intl.DateTimeFormat("es-SV", {
    timeZone: "America/El_Salvador",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
});

// Convierte fecha ISO a DD/MM/AAAA en hora de El Salvador
export function formatearFechaPedido(iso) {
    if (!iso) return "";
    try {
        const fecha = new Date(iso);
        if (Number.isNaN(fecha.getTime())) return "";
        return formatoFecha.format(fecha);
    } catch {
        return "";
    }
}

// Convierte fecha ISO a HH:MM a.m./p.m. en hora de El Salvador
export function formatearHoraPedido(iso) {
    if (!iso) return "";
    try {
        const fecha = new Date(iso);
        if (Number.isNaN(fecha.getTime())) return "";
        return formatoHora.format(fecha);
    } catch {
        return "";
    }
}
