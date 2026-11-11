import api from "./api";

// Obtener catálogo de productos activos con existencias
export const obtenerProductos = () =>
    api.get("/tienda/productos");

// Obtener el detalle de un producto activo.
export const obtenerProductoDetalle = (id) =>
    api.get(`/tienda/productos/${encodeURIComponent(id)}`);

// Crear un nuevo pedido
export const crearPedido = (datos, idempotencyKey) =>
    api.post("/tienda/pedidos", datos, {
        headers: { "Idempotency-Key": idempotencyKey }
    });

// Obtener pedidos del cliente autenticado
export const obtenerMisPedidos = () =>
    api.get("/tienda/mis-pedidos");

// Cancelar un pedido en estado pendiente
export const cancelarMiPedido = (id) =>
    api.put(`/tienda/mis-pedidos/${id}/cancelar`);
