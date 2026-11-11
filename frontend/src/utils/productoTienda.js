export const MAX_UNIDADES_CARRITO = 20;

export function obtenerImagenHttps(imagenUrl) {
    if (typeof imagenUrl !== 'string' || !imagenUrl.trim()) return null;
    try {
        const url = new URL(imagenUrl.trim());
        return url.protocol === 'https:' ? url.href : null;
    } catch {
        return null;
    }
}

export function limitarCantidadProducto(cantidad, stock) {
    const unidadesDisponibles = Number(stock);
    if (!Number.isSafeInteger(unidadesDisponibles) || unidadesDisponibles <= 0) return 0;
    const solicitadas = Number(cantidad);
    const cantidadEntera = Number.isFinite(solicitadas) ? Math.floor(solicitadas) : 1;
    return Math.min(Math.max(cantidadEntera, 1), unidadesDisponibles, MAX_UNIDADES_CARRITO);
}
