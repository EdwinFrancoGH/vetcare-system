export function obtenerCarritoVisible(carrito, uid) {
    if (!uid) return { items: [], cargado: true };
    if (carrito?.uid !== uid) return { items: [], cargado: false };
    return {
        items: Array.isArray(carrito.items) ? carrito.items : [],
        cargado: true,
    };
}
