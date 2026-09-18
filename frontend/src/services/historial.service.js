import api from "./api";

export const obtenerHistoriales = () => api.get("/historial");

export const obtenerHistorial = (id) =>
    api.get(`/historial/${id}`);

export const crearHistorial = (datos) =>
    api.post("/historial", datos);

export const actualizarHistorial = (id, datos) =>
    api.put(`/historial/${id}`, datos);

export const eliminarHistorial = (id) =>
    api.delete(`/historial/${id}`);