import {
    obtenerResumen,
    obtenerReporteStockBajo,
    obtenerReporteVentas
} from "../services/reportes.service.js";

// Obtener resumen general
export const resumenGeneral = async (req, res) => {
    try {
        const resumen = await obtenerResumen();

        res.status(200).json({
            ok: true,
            message: "Resumen general obtenido correctamente.",
            data: resumen
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener el resumen general.",
            error: error.message
        });
    }
};

// Obtener reporte de stock bajo
export const reporteStockBajo = async (req, res) => {
    try {
        const productos = await obtenerReporteStockBajo();

        res.status(200).json({
            ok: true,
            message: "Reporte de stock bajo obtenido correctamente.",
            data: productos
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener el reporte de stock bajo.",
            error: error.message
        });
    }
};

// Obtener reporte de ventas
export const reporteVentas = async (req, res) => {
    try {
        const ventas = await obtenerReporteVentas();

        res.status(200).json({
            ok: true,
            message: "Reporte de ventas obtenido correctamente.",
            data: ventas
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener el reporte de ventas.",
            error: error.message
        });
    }
};