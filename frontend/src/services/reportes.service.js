import api from "./api";

export const obtenerResumen = () =>
    api.get("/reportes/resumen");

export const obtenerReporteStockBajo = () =>
    api.get("/reportes/stock-bajo");

export const obtenerReporteVentas = () =>
    api.get("/reportes/ventas");