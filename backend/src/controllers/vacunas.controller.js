import {
    obtenerTodas,
    obtenerPorId,
    obtenerPorMascota,
    crear,
    actualizar,
    eliminar
} from "../services/vacunas.service.js";

import { validarVacuna } from "../validators/vacuna.validator.js";

import { obtenerPorId as obtenerMascotaPorId } from "../services/mascotas.service.js";

// Obtener todas las vacunas
export const obtenerVacunas = async (req, res) => {
    try {
        const vacunas = await obtenerTodas();

        res.json({
            ok: true,
            data: vacunas
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: error.message
        });
    }
};

// Obtener vacuna por ID
export const obtenerVacunaPorId = async (req, res) => {
    try {
        const vacuna = await obtenerPorId(req.params.id);

        if (!vacuna) {
            return res.status(404).json({
                ok: false,
                mensaje: "Vacuna no encontrada"
            });
        }

        // Si es Cliente, verificar que la mascota asociada le pertenezca
        if (req.userRole === "Cliente") {
            const mascota = await obtenerMascotaPorId(vacuna.mascotaId);

            if (!mascota) {
                return res.status(404).json({
                    ok: false,
                    mensaje: "Mascota no encontrada"
                });
            }

            if (mascota.propietarioUid !== req.user.uid) {
                return res.status(403).json({
                    ok: false,
                    mensaje: "No tienes permiso para consultar esta vacuna"
                });
            }
        }

        res.json({
            ok: true,
            data: vacuna
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: error.message
        });
    }
};

// Obtener vacunas de una mascota específica
export const obtenerVacunasPorMascota = async (req, res) => {
    try {
        const { mascotaId } = req.params;

        // Si es Cliente, verificar que la mascota le pertenezca
        if (req.userRole === "Cliente") {
            const mascota = await obtenerMascotaPorId(mascotaId);

            if (!mascota) {
                return res.status(404).json({
                    ok: false,
                    mensaje: "Mascota no encontrada"
                });
            }

            if (mascota.propietarioUid !== req.user.uid) {
                return res.status(403).json({
                    ok: false,
                    mensaje: "No tienes permiso para consultar las vacunas de esta mascota"
                });
            }
        }

        const vacunas = await obtenerPorMascota(mascotaId);

        res.json({
            ok: true,
            data: vacunas
        });

    } catch (error) {
        console.error("Error obteniendo vacunas por mascota:", error);

        res.status(500).json({
            ok: false,
            mensaje: error.message
        });
    }
};

// Crear vacuna
export const crearVacuna = async (req, res) => {
    try {

        // Los Clientes solo pueden consultar información.
        // La creación de vacunas corresponde al personal clínico.
        if (req.userRole === "Cliente") {
            return res.status(403).json({
                ok: false,
                mensaje: "No tienes permiso para crear vacunas"
            });
        }

        const errorValidacion = validarVacuna(req.body);

        if (errorValidacion) {
            return res.status(400).json({
                ok: false,
                mensaje: errorValidacion
            });
        }

        const vacuna = await crear(req.body);

        res.status(201).json({
            ok: true,
            mensaje: "Vacuna creada correctamente",
            data: vacuna
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: error.message
        });
    }
};

// Actualizar vacuna
export const actualizarVacuna = async (req, res) => {
    try {

        // Los Clientes no pueden modificar vacunas.
        if (req.userRole === "Cliente") {
            return res.status(403).json({
                ok: false,
                mensaje: "No tienes permiso para actualizar vacunas"
            });
        }

        const errorValidacion = validarVacuna(req.body);

        if (errorValidacion) {
            return res.status(400).json({
                ok: false,
                mensaje: errorValidacion
            });
        }

        const vacuna = await actualizar(req.params.id, req.body);

        res.json({
            ok: true,
            mensaje: "Vacuna actualizada correctamente",
            data: vacuna
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: error.message
        });
    }
};

// Eliminar vacuna
export const eliminarVacuna = async (req, res) => {
    try {

        // Los Clientes no pueden eliminar vacunas.
        if (req.userRole === "Cliente") {
            return res.status(403).json({
                ok: false,
                mensaje: "No tienes permiso para eliminar vacunas"
            });
        }

        await eliminar(req.params.id);

        res.json({
            ok: true,
            mensaje: "Vacuna eliminada correctamente"
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            mensaje: error.message
        });
    }
};