import { Router } from "express";
import {
    obtenerMascotas,
    obtenerMascotaPorId,
    crearMascota,
    actualizarMascota,
    eliminarMascota
} from "../controllers/mascotas.controller.js";

const router = Router();

// Obtener todas las mascotas
router.get("/", obtenerMascotas);

// Obtener una mascota por ID
router.get("/:id", obtenerMascotaPorId);

// Crear mascota
router.post("/", crearMascota);

// Actualizar mascota
router.put("/:id", actualizarMascota);

// Eliminar mascota
router.delete("/:id", eliminarMascota);

export default router;