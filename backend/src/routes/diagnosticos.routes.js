import express from "express";

import {
    obtenerDiagnosticos,
    obtenerDiagnosticoPorId,
    crearDiagnostico,
    actualizarDiagnostico,
    eliminarDiagnostico
} from "../controllers/diagnosticos.controller.js";

const router = express.Router();

router.get("/", obtenerDiagnosticos);
router.get("/:id", obtenerDiagnosticoPorId);
router.post("/", crearDiagnostico);
router.put("/:id", actualizarDiagnostico);
router.delete("/:id", eliminarDiagnostico);

export default router;