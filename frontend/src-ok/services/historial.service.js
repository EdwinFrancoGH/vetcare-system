import api from "./api";

// Antes apuntaba a "/historial" (singular), pero el backend expone
// la ruta como "/api/historiales" (plural) en app.js. Con el nombre
// singular, esta pantalla nunca podía traer datos.
export const obtenerHistoriales = () => api.get("/historiales");

export const obtenerHistorial = (id) =>
    api.get(`/historiales/${id}`);

// Historial clínico de una mascota específica (para la futura
// ficha de mascota y la línea de tiempo clínica)
export const obtenerHistorialesPorMascota = (mascotaId) =>
    api.get(`/historiales/mascota/${mascotaId}`);

export const crearHistorial = (datos) =>
    api.post("/historiales", datos);

export const actualizarHistorial = (id, datos) =>
    api.put(`/historiales/${id}`, datos);

export const eliminarHistorial = (id) =>
    api.delete(`/historiales/${id}`);
