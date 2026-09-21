import express from "express";

import {
    obtenerProductos,
    obtenerProductoPorId,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    obtenerProductosStockBajo
} from "../controllers/productos.controller.js";

const router = express.Router();

// Obtener productos con stock bajo
// IMPORTANTE: esta ruta debe ir antes de /:id
router.get("/stock-bajo", obtenerProductosStockBajo);

// Obtener todos los productos
router.get("/", obtenerProductos);

// Obtener un producto por ID
router.get("/:id", obtenerProductoPorId);

// Crear producto
router.post("/", crearProducto);

// Actualizar producto
router.put("/:id", actualizarProducto);

// Eliminar producto
router.delete("/:id", eliminarProducto);

export default router;