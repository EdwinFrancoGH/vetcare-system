import express from "express";
import { exigirClaveIdempotencia } from "../utils/idempotency.js";

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
router.post("/", exigirClaveIdempotencia, registrarVenta);

export default router;
