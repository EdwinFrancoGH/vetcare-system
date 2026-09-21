import api from "./api";

export const obtenerMascotas = () => api.get("/mascotas");

export const obtenerMascota = (id) => api.get(`/mascotas/${id}`);

export const crearMascota = (datos) => api.post("/mascotas", datos);

export const actualizarMascota = (id, datos) =>
    api.put(`/mascotas/${id}`, datos);

export const eliminarMascota = (id) =>
    api.delete(`/mascotas/${id}`);