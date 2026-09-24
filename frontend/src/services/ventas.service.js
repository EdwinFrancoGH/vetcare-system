import api from "./api";

export const obtenerVentas = () =>
    api.get("/ventas");

export const obtenerVenta = (id) =>
    api.get(`/ventas/${id}`);

export const registrarVenta = (datos) =>
    api.post("/ventas", datos);