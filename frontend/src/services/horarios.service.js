import api from "./api";

export const obtenerHorarios = () => api.get("/horarios");

export const obtenerHorarioPorVeterinario = (veterinario) =>
    api.get(`/horarios/${encodeURIComponent(veterinario)}`);

// Crea o reemplaza por completo el horario semanal de un veterinario
export const guardarHorario = (veterinario, datos) =>
    api.put(`/horarios/${encodeURIComponent(veterinario)}`, datos);

export const eliminarHorario = (veterinario) =>
    api.delete(`/horarios/${encodeURIComponent(veterinario)}`);
