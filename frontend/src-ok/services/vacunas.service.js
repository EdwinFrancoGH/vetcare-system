import api from "./api";

export const obtenerVacunas = () => api.get("/vacunas");

export const obtenerVacuna = (id) =>
    api.get(`/vacunas/${id}`);

// Vacunas de una mascota específica (para la futura ficha de mascota
// y las alertas de vencidos)
export const obtenerVacunasPorMascota = (mascotaId) =>
    api.get(`/vacunas/mascota/${mascotaId}`);

export const crearVacuna = (datos) =>
    api.post("/vacunas", datos);

export const actualizarVacuna = (id, datos) =>
    api.put(`/vacunas/${id}`, datos);

export const eliminarVacuna = (id) =>
    api.delete(`/vacunas/${id}`);