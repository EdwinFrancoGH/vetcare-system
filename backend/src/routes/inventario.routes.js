import express from "express";

import {
    listarInventario,
    entradaInventario,
    salidaInventario
} from "../controllers/inventario.controller.js";

const router = express.Router();

// Obtener inventario completo
router.get("/", listarInventario);

// Registrar entrada de productos
router.post("/entrada", entradaInventario);

// Registrar salida de productos
router.post("/salida", salidaInventario);

export default router;