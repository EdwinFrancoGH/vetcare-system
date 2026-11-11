import api from "./api";

export const obtenerServiciosVeterinarios = () => api.get("/servicios-veterinarios");

export const crearServicioVeterinario = (datos) => api.post("/servicios-veterinarios", datos);

export const actualizarServicioVeterinario = (id, datos) =>
    api.patch(`/servicios-veterinarios/${encodeURIComponent(id)}`, datos);

export const cambiarEstadoServicioVeterinario = (id, activo) =>
    api.patch(`/servicios-veterinarios/${encodeURIComponent(id)}/estado`, { activo });
