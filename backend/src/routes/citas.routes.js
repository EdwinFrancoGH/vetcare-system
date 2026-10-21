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
    actualizarCita,
    cancelarCita,
    eliminarCita
} from "../controllers/citas.controller.js";

const router = Router();

// Este módulo lo usan tanto el personal ("Vista Médico") como un
// "Cliente" (dueño de mascota, "Vista Cliente"), así que la
// autorización se decide ruta por ruta en vez de para todo el router:
// - Ver/gestionar TODAS las citas de la clínica (agenda del médico) es
//   personal clínico/administrativo únicamente.
// - Ver disponibilidad, reservar y cancelar es lo que necesita un
//   Cliente para agendar la consulta de su mascota.
const SOLO_PERSONAL = verifyRoles("Administrador", "Recepcionista", "Veterinario");

// IMPORTANTE: las rutas específicas van antes de "/:id" para que Express
// no las confunda con un id de cita.

// Agenda completa de la clínica (todas las citas, de todos los dueños):
// solo personal. Un Cliente ve sus horarios disponibles y reserva, no la
// agenda entera.
router.get("/", SOLO_PERSONAL, obtenerCitas);

// Horarios disponibles, calculados desde /api/horarios (no son
// documentos): esto es justo lo que un Cliente necesita para reservar.
router.get("/disponibles", obtenerCitasDisponibles);

// "Vista Médico": próximas consultas del médico logueado. Personal únicamente.
router.get("/proximas", SOLO_PERSONAL, obtenerProximasConsultas);

// Historial de citas ya resueltas (perdidas, confirmadas, completadas,
// canceladas) de TODA la clínica: personal únicamente.
router.get("/historial", SOLO_PERSONAL, obtenerHistorialCitas);

router.get("/mascota/:mascotaId", obtenerCitasPorMascota);

router.get("/:id", obtenerCitaPorId);

// Registrar una cita directamente (uso del médico/admin, sin pasar por
// el flujo de "horario disponible" del cliente)
router.post("/", SOLO_PERSONAL, crearCita);

// Reservar un horario disponible (lo hace el dueño de la mascota)
router.post("/reservar", reservarCita);

// Cancelar una cita (lo puede hacer el dueño que la reservó, o personal)
router.put("/:id/cancelar", cancelarCita);

// Actualizar una cita (edición general): acción de personal
router.put("/:id", SOLO_PERSONAL, actualizarCita);

// Eliminar una cita: acción de personal
router.delete("/:id", SOLO_PERSONAL, eliminarCita);

export default router;
