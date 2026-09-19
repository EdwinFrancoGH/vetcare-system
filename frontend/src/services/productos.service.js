import api from "./api";

export const obtenerProductos = () => api.get("/productos");

export const obtenerProducto = (id) => api.get(`/productos/${id}`);

export const crearProducto = (datos) => api.post("/productos", datos);

export const actualizarProducto = (id, datos) =>
    api.put(`/productos/${id}`, datos);

export const eliminarProducto = (id) =>
    api.delete(`/productos/${id}`);

export const obtenerProductosStockBajo = () =>
    api.get("/productos/stock-bajo");