import api from "./api";

export const obtenerInventario = () =>
    api.get("/inventario");

export const registrarEntrada = (datos) =>
    api.post("/inventario/entrada", datos);

export const registrarSalida = (datos) =>
    api.post("/inventario/salida", datos);