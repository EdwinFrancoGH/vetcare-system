import { Router } from "express";

import {
    obtenerHorarios,
    obtenerHorarioPorVeterinario,
    guardarHorario,
    eliminarHorario
} from "../controllers/horarios.controller.js";

const router = Router();

// Horario semanal de todos los veterinarios
router.get("/", obtenerHorarios);

// Horario semanal de un veterinario específico
router.get("/:veterinario", obtenerHorarioPorVeterinario);

// Crear o actualizar (upsert) el horario semanal de un veterinario
router.put("/:veterinario", guardarHorario);

// Eliminar el horario semanal de un veterinario
router.delete("/:veterinario", eliminarHorario);

export default router;
