import api from "./api";

export const obtenerCitas = () => api.get("/citas");

export const obtenerCita = (id) => api.get(`/citas/${id}`);

// Horarios disponibles (vista Cliente), calculados en el backend a partir
// del horario semanal del veterinario. `params` puede incluir
// { veterinario, desde, hasta } (todos opcionales).
export const obtenerCitasDisponibles = (params = {}) =>
    api.get("/citas/disponibles", { params });

// Próximas consultas de un médico (vista Médico). Sin "veterinario",
// devuelve las próximas consultas de todos los médicos.
export const obtenerProximasConsultas = (veterinario) =>
    api.get("/citas/proximas", {
        params: veterinario ? { veterinario } : {},
    });

export const obtenerCitasPorMascota = (mascotaId) =>
    api.get(`/citas/mascota/${mascotaId}`);

// Historial de citas ya resueltas o vencidas (vista Médico): perdidas,
// confirmadas, completadas y canceladas. `params` puede incluir
// { veterinario, estado } (ambos opcionales).
export const obtenerHistorialCitas = (params = {}) =>
    api.get("/citas/historial", { params });

// Registrar una cita directamente (uso del médico/admin)
export const crearCita = (datos) => api.post("/citas", datos);

// Reservar un horario disponible (lo hace el dueño de la mascota). Ya no
// reserva un documento existente: envía veterinario+fecha+hora y el
// backend valida contra el horario semanal antes de crear la cita.
export const reservarCita = (datos) => api.post("/citas/reservar", datos);

export const actualizarCita = (id, datos) =>
    api.put(`/citas/${id}`, datos);

export const cancelarCita = (id) => api.put(`/citas/${id}/cancelar`);

export const eliminarCita = (id) => api.delete(`/citas/${id}`);
