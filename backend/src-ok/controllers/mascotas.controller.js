import {
    obtenerTodas,
    obtenerPorId,
    crear,
    actualizar,
    eliminar
} from "../services/mascotas.service.js";

import { validarMascota } from "../validators/mascota.validator.js";

// Obtener todas las mascotas
export const obtenerMascotas = async (req, res) => {
    try {
        const mascotas = await obtenerTodas();

        res.status(200).json({
            ok: true,
            message: "Mascotas obtenidas correctamente.",
            data: mascotas
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener las mascotas.",
            error: error.message
        });
    }
};

// Obtener mascota por ID
export const obtenerMascotaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const mascota = await obtenerPorId(id);

        if (!mascota) {
            return res.status(404).json({
                ok: false,
                message: "Mascota no encontrada."
            });
        }

        res.status(200).json({
            ok: true,
            message: "Mascota obtenida correctamente.",
            data: mascota
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener la mascota.",
            error: error.message
        });
    }
};

// Crear mascota
export const crearMascota = async (req, res) => {
    try {

            const errorValidacion = validarMascota(req.body);

            if (errorValidacion) {
                return res.status(400).json({
                    ok: false,
                    message: errorValidacion
                });
            }
        const nuevaMascota = await crear(req.body);

        res.status(201).json({
            ok: true,
            message: "Mascota creada correctamente.",
            data: nuevaMascota
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al crear la mascota.",
            error: error.message
        });
    }
};

// Actualizar mascota
export const actualizarMascota = async (req, res) => {
    try {

        const { id } = req.params;
            const errorValidacion = validarMascota(req.body);

            if (errorValidacion) {
                return res.status(400).json({
                    ok: false,
                    message: errorValidacion
                });
            }
        const mascota = await actualizar(id, req.body);

        if (!mascota) {
            return res.status(404).json({
                ok: false,
                message: "Mascota no encontrada."
            });
        }

        res.status(200).json({
            ok: true,
            message: "Mascota actualizada correctamente.",
            data: mascota
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al actualizar la mascota.",
            error: error.message
        });
    }
};

// Eliminar mascota
export const eliminarMascota = async (req, res) => {
    try {

        const { id } = req.params;

        const eliminada = await eliminar(id);

        if (!eliminada) {
            return res.status(404).json({
                ok: false,
                message: "Mascota no encontrada."
            });
        }

        res.status(200).json({
            ok: true,
            message: "Mascota eliminada correctamente."
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al eliminar la mascota.",
            error: error.message
        });
    }
};