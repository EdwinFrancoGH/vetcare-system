import { Router } from "express";
import { verifyRoles } from "../middlewares/auth.middleware.js";

import {
    obtenerHistoriales,
    obtenerHistorialPorId,
    obtenerHistorialPorMascota,
    crearHistorial,
    actualizarHistorial,
    eliminarHistorial
} from "../controllers/historial.controller.js";

export const crearRouterHistorial = (verificarRoles = verifyRoles) => {
const router = Router();
const soloLectura = verificarRoles("Administrador", "Veterinario", "Cliente");
const soloClinico = verificarRoles("Administrador", "Veterinario");

router.get("/", soloLectura, obtenerHistoriales);

router.get("/mascota/:mascotaId", soloLectura, obtenerHistorialPorMascota);

router.get("/:id", soloLectura, obtenerHistorialPorId);

router.post("/", soloClinico, crearHistorial);

router.put("/:id", soloClinico, actualizarHistorial);

router.delete("/:id", soloClinico, eliminarHistorial);

return router;
};

export default crearRouterHistorial();
