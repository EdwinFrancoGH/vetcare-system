// El controller recibe los datos,
// ejecuta la validación
// y llama al service correspondiente.

import {
    obtenerTodas,
    obtenerPorId,
    crear,
    actualizar,
    eliminar
} from "../services/consultas.service.js";

import { validarConsulta } from "../validators/consulta.validator.js";

export const obtenerConsultas = async (req, res) => {
    try {
        const consultas = await obtenerTodas();

        res.status(200).json({
            ok: true,
            data: consultas
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: "Error al obtener las consultas"
        });
    }
};

export const obtenerConsultaPorId = async (req, res) => {
    try {
        const consulta = await obtenerPorId(req.params.id);

        if (!consulta) {
            return res.status(404).json({
                ok: false,
                error: "Consulta no encontrada"
            });
        }

        res.status(200).json({
            ok: true,
            data: consulta
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: "Error al obtener la consulta"
        });
    }
};

export const crearConsulta = async (req, res) => {
    try {
        const validacion = validarConsulta(req.body);

        if (!validacion.valido) {
            return res.status(400).json({
                ok: false,
                errores: validacion.errores
            });
        }

        const consulta = await crear(req.body);

        if (consulta.citaNoEncontrada) {
            return res.status(404).json({
                ok: false,
                error: "La cita asociada no existe"
            });
        }

        if (consulta.citaYaAtendida) {
            return res.status(409).json({
                ok: false,
                error: "La cita ya fue atendida"
            });
        }

        if (consulta.consultaExistente) {
            return res.status(409).json({
                ok: false,
                error: "La cita ya tiene una consulta registrada"
            });
        }

        res.status(201).json({
            ok: true,
            mensaje: "Consulta creada correctamente",
            data: consulta
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: "Error al crear la consulta"
        });
    }
};

export const actualizarConsulta = async (req, res) => {
    try {
        const validacion = validarConsulta(req.body);

        if (!validacion.valido) {
            return res.status(400).json({
                ok: false,
                errores: validacion.errores
            });
        }

        const consulta = await actualizar(req.params.id, req.body);

        if (!consulta) {
            return res.status(404).json({
                ok: false,
                error: "Consulta no encontrada"
            });
        }

        res.status(200).json({
            ok: true,
            mensaje: "Consulta actualizada correctamente",
            data: consulta
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: "Error al actualizar la consulta"
        });
    }
};

export const eliminarConsulta = async (req, res) => {
    try {
        const eliminada = await eliminar(req.params.id);

        if (!eliminada) {
            return res.status(404).json({
                ok: false,
                error: "Consulta no encontrada"
            });
        }

        res.status(200).json({
            ok: true,
            mensaje: "Consulta eliminada correctamente"
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            error: "Error al eliminar la consulta"
        });
    }
};