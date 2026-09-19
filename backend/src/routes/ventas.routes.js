import express from "express";

import {
    obtenerVentas,
    obtenerVentaPorId,
    registrarVenta
} from "../controllers/ventas.controller.js";

const router = express.Router();

// Obtener todas las ventas
router.get("/", obtenerVentas);

// Obtener una venta por ID
router.get("/:id", obtenerVentaPorId);

// Registrar una nueva venta
router.post("/", registrarVenta);

export default router;