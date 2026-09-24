import api from "./api";

export const obtenerClientes = () => api.get("/clientes");

export const crearCliente = (datos) => api.post("/clientes", datos);

export const actualizarCliente = (id, datos) =>
    api.put(`/clientes/${id}`, datos);

export const eliminarCliente = (id) => api.delete(`/clientes/${id}`);
