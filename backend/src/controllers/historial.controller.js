import {
    obtenerTodos,
    obtenerPorId,
    obtenerPorMascota,
    crear,
    actualizar,
    eliminar
} from "../services/historial.service.js";

import { validarHistorial } from "../validators/historial.validator.js";

import { obtenerPorId as obtenerMascotaPorId, obtenerPorPropietario } from "../services/mascotas.service.js";

// Obtener todos los historiales
export const obtenerHistoriales = async (req, res) => {
    try {
        let historiales;

        // Corrección de seguridad: si es Cliente, solo puede consultar historiales de sus mascotas
        if (req.userRole === "Cliente") {
            const misMascotas = await obtenerPorPropietario(req.user.uid);
            const grupos = await Promise.all(misMascotas.map((mascota) => obtenerPorMascota(mascota.id)));
            historiales = grupos.flat();
        } else {
            historiales = await obtenerTodos();
        }

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

        // Si es Cliente, verificar que la mascota asociada le pertenezca
        if (req.userRole === "Cliente") {

            const mascota = await obtenerMascotaPorId(historial.mascotaId);

            if (!mascota) {
                return res.status(404).json({
                    ok: false,
                    mensaje: "Mascota no encontrada"
                });
            }

            if (mascota.propietarioUid !== req.user.uid) {
                return res.status(403).json({
                    ok: false,
                    mensaje: "No tienes permiso para consultar este historial"
                });
            }
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
                    mensaje: "No tienes permiso para consultar el historial de esta mascota"
                });
            }
        }

        const historiales = await obtenerPorMascota(mascotaId);

        res.json({
            ok: true,
            historiales
        });

    } catch (error) {

        console.error("Error obteniendo historial por mascota:", error);

        res.status(500).json({
            ok: false,
            mensaje: error.message
        });

    }

};

// Crear historial
export const crearHistorial = async (req, res) => {

    try {

        // Los Clientes solo pueden consultar información.
        // La creación de historiales corresponde al personal clínico.
        if (req.userRole === "Cliente") {
            return res.status(403).json({
                ok: false,
                mensaje: "No tienes permiso para crear historiales médicos"
            });
        }

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

        if (error.message === "MASCOTA_NO_ENCONTRADA") {
            return res.status(404).json({ ok: false, mensaje: "La mascota asociada no existe." });
        }
        if (error.message === "MASCOTA_ARCHIVADA") {
            return res.status(409).json({ ok: false, mensaje: "No se pueden crear registros para una mascota archivada." });
        }

        res.status(500).json({
            ok: false,
            mensaje: error.message
        });

    }

};

// Actualizar historial
export const actualizarHistorial = async (req, res) => {

    try {

        // Los Clientes no pueden modificar historiales médicos.
        if (req.userRole === "Cliente") {
            return res.status(403).json({
                ok: false,
                mensaje: "No tienes permiso para actualizar historiales médicos"
            });
        }

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

        if (error.message === "MASCOTA_NO_ENCONTRADA") {
            return res.status(404).json({ ok: false, mensaje: "La mascota asociada no existe." });
        }
        if (error.message === "MASCOTA_ARCHIVADA") {
            return res.status(409).json({ ok: false, mensaje: "No se puede reasignar el registro a una mascota archivada." });
        }

        res.status(500).json({
            ok: false,
            mensaje: error.message
        });

    }

};

// Eliminar historial
export const eliminarHistorial = async (req, res) => {

    try {

        // Los Clientes no pueden eliminar historiales médicos.
        if (req.userRole === "Cliente") {
            return res.status(403).json({
                ok: false,
                mensaje: "No tienes permiso para eliminar historiales médicos"
            });
        }

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
