import { Router } from "express";

import {
    obtenerHistoriales,
    obtenerHistorialPorId,
    crearHistorial,
    actualizarHistorial,
    eliminarHistorial
} from "../controllers/historial.controller.js";

const router = Router();

router.get("/", obtenerHistoriales);

router.get("/:id", obtenerHistorialPorId);

router.post("/", crearHistorial);

router.put("/:id", actualizarHistorial);

router.delete("/:id", eliminarHistorial);

export default router;