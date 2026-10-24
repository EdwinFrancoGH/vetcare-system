import { formatearFechaPedido } from "./fechasPedido";

// Calcula la nueva fecha límite sumando 2 días al mayor entre el plazo actual y hoy
export function calcularNuevaFechaLimite(pedido, diasBase = 3) {
    if (!pedido) return "";
    const baseMs = pedido.fechaLimite
        ? new Date(pedido.fechaLimite).getTime()
        : new Date(pedido.fechaPedido).getTime() + diasBase * 24 * 60 * 60 * 1000;
    const mayorMs = Math.max(baseMs, Date.now());
    return new Date(mayorMs + 2 * 24 * 60 * 60 * 1000).toISOString();
}

// Devuelve el texto formateado de la nueva fecha límite
export function obtenerTextoNuevaFechaLimite(pedido) {
    const iso = calcularNuevaFechaLimite(pedido);
    return formatearFechaPedido(iso);
}
