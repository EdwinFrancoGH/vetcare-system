import { Router } from "express";

import {
    obtenerCitas,
    obtenerCitaPorId,
    crearCita,
    actualizarCita,
    eliminarCita
} from "../controllers/citas.controller.js";

const router = Router();

router.get("/", obtenerCitas);
router.get("/:id", obtenerCitaPorId);
router.post("/", crearCita);
router.put("/:id", actualizarCita);
router.delete("/:id", eliminarCita);

export default router;