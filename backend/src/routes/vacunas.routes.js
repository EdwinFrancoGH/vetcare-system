import { Router } from "express";
import { verifyRoles } from "../middlewares/auth.middleware.js";

import {
    obtenerVacunas,
    obtenerVacunaPorId,
    obtenerVacunasPorMascota,
    crearVacuna,
    actualizarVacuna,
    eliminarVacuna
} from "../controllers/vacunas.controller.js";

export const crearRouterVacunas = (verificarRoles = verifyRoles) => {
const router = Router();
const soloLectura = verificarRoles("Administrador", "Veterinario", "Cliente");
const soloClinico = verificarRoles("Administrador", "Veterinario");

// GET /api/vacunas
router.get("/", soloLectura, obtenerVacunas);

// GET /api/vacunas/mascota/:mascotaId
router.get("/mascota/:mascotaId", soloLectura, obtenerVacunasPorMascota);

// GET /api/vacunas/:id
router.get("/:id", soloLectura, obtenerVacunaPorId);

// POST /api/vacunas
router.post("/", soloClinico, crearVacuna);

// PUT /api/vacunas/:id
router.put("/:id", soloClinico, actualizarVacuna);

// DELETE /api/vacunas/:id
router.delete("/:id", soloClinico, eliminarVacuna);

return router;
};

export default crearRouterVacunas();
