import { Router } from "express";

import { verifyRoles } from "../middlewares/auth.middleware.js";

import {
    obtenerCitas,
    obtenerCitasDisponibles,
    obtenerProximasConsultas,
    obtenerHistorialCitas,
    obtenerCitasPorMascota,
    obtenerCitaPorId,
    crearCita,
    reservarCita,
    reprogramarCita,
    actualizarCita,
    cancelarCita,
    eliminarCita
} from "../controllers/citas.controller.js";
import {
    consultarPagoCitaController,
    reportarPagoCitaController,
} from "../controllers/pagos-citas.controller.js";

const controladores = {
    obtenerCitas,
    obtenerCitasDisponibles,
    obtenerProximasConsultas,
    obtenerHistorialCitas,
    obtenerCitasPorMascota,
    obtenerCitaPorId,
    crearCita,
    reservarCita,
    reprogramarCita,
    actualizarCita,
    cancelarCita,
    eliminarCita,
    consultarPagoCita: consultarPagoCitaController,
    reportarPagoCita: reportarPagoCitaController
};

export const crearRouterCitas = (verificarRoles = verifyRoles, handlers = controladores) => {
const router = Router();

// Este módulo lo usan tanto el personal ("Vista Médico") como un
// "Cliente" (dueño de mascota, "Vista Cliente"), así que la
// autorización se decide ruta por ruta en vez de para todo el router:
// - Ver/gestionar TODAS las citas de la clínica (agenda del médico) es
//   personal clínico/administrativo únicamente.
// - Ver disponibilidad, reservar y cancelar es lo que necesita un
//   Cliente para agendar la consulta de su mascota.
const SOLO_PERSONAL = verificarRoles("Administrador", "Recepcionista", "Veterinario");

// IMPORTANTE: las rutas específicas van antes de "/:id" para que Express
// no las confunda con un id de cita.

// Agenda completa de la clínica (todas las citas, de todos los dueños):
// solo personal. Un Cliente ve sus horarios disponibles y reserva, no la
// agenda entera.
router.get("/", SOLO_PERSONAL, handlers.obtenerCitas);

// Horarios disponibles, calculados desde /api/horarios (no son
// documentos): esto es justo lo que un Cliente necesita para reservar.
router.get("/disponibles", handlers.obtenerCitasDisponibles);

// "Vista Médico": próximas consultas del médico logueado. Personal únicamente.
router.get("/proximas", SOLO_PERSONAL, handlers.obtenerProximasConsultas);

// Historial de citas ya resueltas (perdidas, confirmadas, completadas,
// canceladas) de TODA la clínica: personal únicamente.
router.get("/historial", SOLO_PERSONAL, handlers.obtenerHistorialCitas);

// Consulta financiera disponible solo para el propietario, Administrador o Recepcionista.
router.get("/:id/pago", handlers.consultarPagoCita);

router.get("/mascota/:mascotaId", handlers.obtenerCitasPorMascota);

router.get("/:id", handlers.obtenerCitaPorId);

// Registrar una cita directamente (uso del médico/admin, sin pasar por
// el flujo de "horario disponible" del cliente)
router.post("/", SOLO_PERSONAL, handlers.crearCita);

// Reservar un horario disponible (lo hace el dueño de la mascota)
router.post("/reservar", handlers.reservarCita);

// El reporte financiero es exclusivo del rol Cliente; el controlador valida propiedad e importe.
router.post("/:id/pago/reportar", verificarRoles("Cliente"), handlers.reportarPagoCita);

// Reprogramar es una operación exclusiva de personal y se ejecuta en una transacción.
router.patch("/:id/reprogramar", SOLO_PERSONAL, handlers.reprogramarCita);

// Cancelar una cita (lo puede hacer el dueño que la reservó, o personal)
router.put("/:id/cancelar", handlers.cancelarCita);

// Actualizar una cita (edición general): acción de personal
router.put("/:id", SOLO_PERSONAL, handlers.actualizarCita);

// Eliminar una cita: acción de personal
router.delete("/:id", SOLO_PERSONAL, handlers.eliminarCita);

return router;
};

const router = crearRouterCitas();
export default router;
