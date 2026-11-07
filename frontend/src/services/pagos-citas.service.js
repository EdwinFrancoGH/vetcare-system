import api from "./api";
import { crearServicioPagosCitasWeb } from "../utils/pagosCitasAdmin";
export { crearServicioPagosCitasWeb } from "../utils/pagosCitasAdmin";

const servicio = crearServicioPagosCitasWeb(api);
export const obtenerPagosPendientes = servicio.obtenerPendientes;
export const consultarDetallePagoCita = servicio.consultarDetalle;
export const aprobarPagoCita = servicio.aprobar;
export const rechazarPagoCita = servicio.rechazar;
