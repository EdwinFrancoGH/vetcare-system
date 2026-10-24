import api from "./api";

// Obtener catálogo de productos activos con existencias
export const obtenerProductos = () =>
    api.get("/tienda/productos");

// Crear un nuevo pedido
export const crearPedido = (datos) =>
    api.post("/tienda/pedidos", datos);

// Obtener pedidos del cliente autenticado
export const obtenerMisPedidos = () =>
    api.get("/tienda/mis-pedidos");

// Cancelar un pedido en estado pendiente
export const cancelarMiPedido = (id) =>
    api.put(`/tienda/mis-pedidos/${id}/cancelar`);
