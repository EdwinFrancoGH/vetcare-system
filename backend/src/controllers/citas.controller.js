// El controller recibe los datos,
// los manda a validarCita(),
// y si son correctos llama a las funciones del service.

import {
    obtenerTodas,
    obtenerPorId,
    obtenerAgenda,
    crear,
    actualizar,
    eliminar
} from "../services/citas.service.js";

import { validarCita } from "../validators/cita.validators.js";

export const obtenerCitas = async (req, res) => {
    try {
        const citas = await obtenerTodas();

        res.status(200).json({
            ok: true,
            data: citas
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: "Error al obtener las citas"
        });
    }
};

export const obtenerCitaPorId = async (req, res) => {
    try {
        const cita = await obtenerPorId(req.params.id);

        if (!cita) {
            return res.status(404).json({
                ok: false,
                error: "Cita no encontrada"
            });
        }

        res.status(200).json({
            ok: true,
            data: cita
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: "Error al obtener la cita"
        });
    }
};

export const obtenerAgendaCitas = async (req, res) => {
    try {
        const { fecha, veterinarioId } = req.query;

        if (!fecha) {
            return res.status(400).json({
                ok: false,
                error: "La fecha es obligatoria"
            });
        }

        const citas = await obtenerAgenda(fecha, veterinarioId);

        res.status(200).json({
            ok: true,
            data: citas
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: "Error al obtener la agenda"
        });
    }
};

export const crearCita = async (req, res) => {
    try {
        const validacion = validarCita(req.body);

        if (!validacion.valido) {
            return res.status(400).json({
                ok: false,
                errores: validacion.errores
            });
        }

        const cita = await crear(req.body);

        if (cita.conflicto) {
            return res.status(409).json({
                ok: false,
                error: "El veterinario ya tiene una cita en ese horario"
            });
        }

        res.status(201).json({
            ok: true,
            mensaje: "Cita creada correctamente",
            data: cita
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: "Error al crear la cita"
        });
    }
};

export const actualizarCita = async (req, res) => {
    try {
        const validacion = validarCita(req.body);

        if (!validacion.valido) {
            return res.status(400).json({
                ok: false,
                errores: validacion.errores
            });
        }

        const cita = await actualizar(req.params.id, req.body);

        if (!cita) {
            return res.status(404).json({
                ok: false,
                error: "Cita no encontrada"
            });
        }

        if (cita.conflicto) {
            return res.status(409).json({
                ok: false,
                error: "El veterinario ya tiene una cita en ese horario"
            });
        }

        res.status(200).json({
            ok: true,
            mensaje: "Cita actualizada correctamente",
            data: cita
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: "Error al actualizar la cita"
        });
    }
};

export const eliminarCita = async (req, res) => {
    try {
        const eliminada = await eliminar(req.params.id);

        if (!eliminada) {
            return res.status(404).json({
                ok: false,
                error: "Cita no encontrada"
            });
        }

        res.status(200).json({
            ok: true,
            mensaje: "Cita eliminada correctamente"
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: "Error al eliminar la cita"
        });
    }
};