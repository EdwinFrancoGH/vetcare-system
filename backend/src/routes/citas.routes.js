import { Router } from "express";

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

// IMPORTANTE: las rutas específicas van antes de "/:id" para que Express
// no las confunda con un id de cita.
router.get("/", obtenerCitas);

// Horarios disponibles, calculados desde /api/horarios (no son documentos)
router.get("/disponibles", obtenerCitasDisponibles);

router.get("/proximas", obtenerProximasConsultas);

// Historial de citas ya resueltas: perdidas, confirmadas, completadas y canceladas
router.get("/historial", obtenerHistorialCitas);

router.get("/mascota/:mascotaId", obtenerCitasPorMascota);

router.get("/:id", obtenerCitaPorId);

// Registrar una cita directamente (uso del médico/admin)
router.post("/", crearCita);

// Reservar un horario disponible (lo hace el dueño de la mascota)
router.post("/reservar", reservarCita);

// Cancelar una cita
router.put("/:id/cancelar", cancelarCita);

// Actualizar una cita (edición general)
router.put("/:id", actualizarCita);

// Eliminar una cita
router.delete("/:id", eliminarCita);

export default router;
