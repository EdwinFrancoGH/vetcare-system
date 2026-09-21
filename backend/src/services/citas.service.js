import * as firestore from "./firestore.service.js";

const COLECCION = "citas";

// Todas las citas son reales (ya agendadas). La disponibilidad "vacía"
// no se guarda en esta colección: se calcula al vuelo combinando el
// horario semanal del veterinario con las citas que ya existen aquí
// (ver controllers/citas.controller.js y utils/disponibilidad.js).

export const obtenerTodas = () =>
    firestore.obtenerTodos(COLECCION);

export const obtenerPorId = (id) =>
    firestore.obtenerPorId(COLECCION, id);

// Citas de una mascota específica (historial de citas del paciente)
export const obtenerPorMascota = (mascotaId) =>
    firestore.obtenerPorCampo(COLECCION, "mascotaId", mascotaId);

// Todas las citas asignadas a un veterinario (para calcular disponibilidad
// y para "mis próximas consultas")
export const obtenerPorVeterinario = (veterinario) =>
    firestore.obtenerPorCampo(COLECCION, "veterinario", veterinario);

export const crear = (datos) =>
    firestore.crear(COLECCION, datos);

export const actualizar = (id, datos) =>
    firestore.actualizar(COLECCION, id, datos);

export const eliminar = (id) =>
    firestore.eliminar(COLECCION, id);
