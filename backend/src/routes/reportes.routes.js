import express from "express";

import {
    resumenGeneral,
    reporteStockBajo,
    reporteVentas
} from "../controllers/reportes.controller.js";

const router = express.Router();

// Resumen general para dashboard
router.get("/resumen", resumenGeneral);

// Reporte de productos con stock bajo
router.get("/stock-bajo", reporteStockBajo);

// Reporte de ventas
router.get("/ventas", reporteVentas);

export default router;