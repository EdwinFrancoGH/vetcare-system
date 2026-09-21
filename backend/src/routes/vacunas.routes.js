import { Router } from "express";

import {
    obtenerVacunas,
    obtenerVacunaPorId,
    obtenerVacunasPorMascota,
    crearVacuna,
    actualizarVacuna,
    eliminarVacuna
} from "../controllers/vacunas.controller.js";

const router = Router();

// GET /api/vacunas
router.get("/", obtenerVacunas);

// GET /api/vacunas/mascota/:mascotaId
router.get("/mascota/:mascotaId", obtenerVacunasPorMascota);

// GET /api/vacunas/:id
router.get("/:id", obtenerVacunaPorId);

// POST /api/vacunas
router.post("/", crearVacuna);

// PUT /api/vacunas/:id
router.put("/:id", actualizarVacuna);

// DELETE /api/vacunas/:id
router.delete("/:id", eliminarVacuna);

export default router;