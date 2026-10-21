import api from "./api";

// Obtener lista de pedidos (con filtro opcional por estado)
export const obtenerPedidos = (estado) =>
    api.get("/pedidos", { params: estado ? { estado } : {} });

// Cambiar estado de un pedido (listo, entregado, cancelado)
export const cambiarEstadoPedido = (id, estado, metodoPago) =>
    api.put(`/pedidos/${id}/estado`, {
        estado,
        ...(metodoPago ? { metodoPago } : {})
    });
