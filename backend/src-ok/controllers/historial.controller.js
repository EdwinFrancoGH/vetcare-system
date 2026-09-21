import {
    obtenerTodos,
    obtenerPorId,
    obtenerPorMascota,
    crear,
    actualizar,
    eliminar
} from "../services/historial.service.js";

import { validarHistorial } from "../validators/historial.validator.js";

// Obtener todos los historiales
export const obtenerHistoriales = async (req, res) => {
    try {
        const historiales = await obtenerTodos();

        res.json({
            ok: true,
            historiales
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            mensaje: error.message
        });

    }
};

// Obtener historial por ID
export const obtenerHistorialPorId = async (req, res) => {

    try {

        const historial = await obtenerPorId(req.params.id);

        if (!historial) {

            return res.status(404).json({
                ok: false,
                mensaje: "Historial no encontrado"
            });

        }

        res.json({
            ok: true,
            historial
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            mensaje: error.message
        });

    }

};

// Obtener historial de una mascota específica
export const obtenerHistorialPorMascota = async (req, res) => {

    try {

        const historiales = await obtenerPorMascota(req.params.mascotaId);

        res.json({
            ok: true,
            historiales
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            mensaje: error.message
        });

    }

};

// Crear historial
export const crearHistorial = async (req, res) => {

    try {

        const errorValidacion = validarHistorial(req.body);

        if (errorValidacion) {
            return res.status(400).json({
                ok: false,
                mensaje: errorValidacion
            });
        }

        const nuevoHistorial = await crear(req.body);

        res.status(201).json({
            ok: true,
            historial: nuevoHistorial
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            mensaje: error.message
        });

    }

};

// Actualizar historial
export const actualizarHistorial = async (req, res) => {

    try {

        const errorValidacion = validarHistorial(req.body);

        if (errorValidacion) {
            return res.status(400).json({
                ok: false,
                mensaje: errorValidacion
            });
        }

        const historialActualizado = await actualizar(
            req.params.id,
            req.body
        );

        if (!historialActualizado) {

            return res.status(404).json({
                ok: false,
                mensaje: "Historial no encontrado"
            });

        }

        res.json({
            ok: true,
            historial: historialActualizado
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            mensaje: error.message
        });

    }

};

// Eliminar historial
export const eliminarHistorial = async (req, res) => {

    try {

        const eliminado = await eliminar(req.params.id);

        if (!eliminado) {

            return res.status(404).json({
                ok: false,
                mensaje: "Historial no encontrado"
            });

        }

        res.json({
            ok: true,
            mensaje: "Historial eliminado correctamente"
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            mensaje: error.message
        });

    }

};