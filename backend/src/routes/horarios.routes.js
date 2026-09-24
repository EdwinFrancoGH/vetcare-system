import { Router } from "express";

import { verifyRoles } from "../middlewares/auth.middleware.js";

import {
    obtenerHorarios,
    obtenerHorarioPorVeterinario,
    guardarHorario,
    eliminarHorario
} from "../controllers/horarios.controller.js";

const router = Router();

// Lectura: la necesita cualquier usuario autenticado, incluido un
// "Cliente" (para ver qué médicos tienen horario y reservar una cita).
router.get("/", obtenerHorarios);
router.get("/:veterinario", obtenerHorarioPorVeterinario);

// Escritura: configurar el horario semanal de atención es una acción de
// personal clínico/administrativo, no de un Cliente.
router.put("/:veterinario", verifyRoles("Administrador", "Recepcionista", "Veterinario"), guardarHorario);
router.delete("/:veterinario", verifyRoles("Administrador", "Recepcionista", "Veterinario"), eliminarHorario);

export default router;
