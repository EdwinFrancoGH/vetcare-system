import { Router } from "express";

import {
    obtenerConsultas,
    obtenerConsultaPorId,
    crearConsulta,
    actualizarConsulta,
    eliminarConsulta
} from "../controllers/consultas.controller.js";

const router = Router();

router.get("/", obtenerConsultas);

router.get("/:id", obtenerConsultaPorId);

router.post("/", crearConsulta);

router.put("/:id", actualizarConsulta);

router.delete("/:id", eliminarConsulta);

export default router;