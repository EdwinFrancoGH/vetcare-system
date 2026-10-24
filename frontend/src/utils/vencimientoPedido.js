// Utilidades para cálculo y validación de vencimiento de pedidos de retiro

const DIAS_PARA_RETIRAR = 3;

// Obtiene la fecha límite en formato ISO (guardada o calculada con 3 días)
export function obtenerFechaLimitePedido(pedido) {
    if (!pedido) return null;
    if (pedido.fechaLimite) return pedido.fechaLimite;
    if (!pedido.fechaPedido) return null;
    const base = new Date(pedido.fechaPedido);
    if (Number.isNaN(base.getTime())) return null;
    return new Date(base.getTime() + DIAS_PARA_RETIRAR * 24 * 60 * 60 * 1000).toISOString();
}

// Verifica si la fecha cae hoy o mañana en la zona horaria de El Salvador
export function esVencimientoHoyOManyana(fechaIso) {
    if (!fechaIso) return false;
    try {
        const fechaObj = new Date(fechaIso);
        if (Number.isNaN(fechaObj.getTime())) return false;

        const formato = new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/El_Salvador",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });

        const ahora = new Date();
        const hoySV = formato.format(ahora);
        const manianaSV = formato.format(new Date(ahora.getTime() + 24 * 60 * 60 * 1000));
        const fechaSV = formato.format(fechaObj);

        return fechaSV === hoySV || fechaSV === manianaSV;
    } catch {
        return false;
    }
}

// Verifica si vence hoy, mañana o si ya venció (para marcar en rojo)
export function esVencimientoProximo(fechaIso) {
    if (!fechaIso) return false;
    try {
        const fechaObj = new Date(fechaIso);
        if (Number.isNaN(fechaObj.getTime())) return false;

        const formato = new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/El_Salvador",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });

        const manianaSV = formato.format(new Date(Date.now() + 24 * 60 * 60 * 1000));
        const fechaSV = formato.format(fechaObj);

        return fechaSV <= manianaSV;
    } catch {
        return false;
    }
}
