import { Router } from "express";

import {
    obtenerHistoriales,
    obtenerHistorialPorId,
    obtenerHistorialPorMascota,
    crearHistorial,
    actualizarHistorial,
    eliminarHistorial
} from "../controllers/historial.controller.js";

const router = Router();

router.get("/", obtenerHistoriales);

router.get("/mascota/:mascotaId", obtenerHistorialPorMascota);

router.get("/:id", obtenerHistorialPorId);

router.post("/", crearHistorial);

router.put("/:id", actualizarHistorial);

router.delete("/:id", eliminarHistorial);

export default router;