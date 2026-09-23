import {
    obtenerTodas,
    obtenerPorId,
    crear,
    actualizar,
    eliminar
} from "../services/diagnosticos.service.js";

import { validarDiagnostico } from "../validators/diagnostico.validator.js";

export const obtenerDiagnosticos = async (req, res) => {
    try {
        const diagnosticos = await obtenerTodas();

        res.status(200).json({
            ok: true,
            data: diagnosticos
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            ok: false,
            error: "No fue posible obtener los diagnósticos"
        });
    }
};

export const obtenerDiagnosticoPorId = async (req, res) => {
    try {
        const diagnostico = await obtenerPorId(req.params.id);

        if (!diagnostico) {
            return res.status(404).json({
                ok: false,
                error: "Diagnóstico no encontrado"
            });
        }

        res.status(200).json({
            ok: true,
            data: diagnostico
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            ok: false,
            error: "No fue posible obtener el diagnóstico"
        });
    }
};

export const crearDiagnostico = async (req, res) => {
    try {
        const validacion = validarDiagnostico(req.body);

        if (!validacion.valido) {
            return res.status(400).json({
                ok: false,
                error: "Datos inválidos",
                detalles: validacion.errores
            });
        }

        const resultado = await crear(req.body);

        if (resultado.consultaNoEncontrada) {
            return res.status(404).json({
                ok: false,
                error: "La consulta no existe"
            });
        }

        if (resultado.diagnosticoExistente) {
            return res.status(409).json({
                ok: false,
                error: "La consulta ya tiene un diagnóstico registrado"
            });
        }

        res.status(201).json({
            ok: true,
            mensaje: "Diagnóstico registrado correctamente",
            data: resultado
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            ok: false,
            error: "No fue posible registrar el diagnóstico"
        });
    }
};

export const actualizarDiagnostico = async (req, res) => {
    try {
        const validacion = validarDiagnostico(req.body);

        if (!validacion.valido) {
            return res.status(400).json({
                ok: false,
                error: "Datos inválidos",
                detalles: validacion.errores
            });
        }

        const diagnostico = await actualizar(
            req.params.id,
            req.body
        );

        if (!diagnostico) {
            return res.status(404).json({
                ok: false,
                error: "Diagnóstico no encontrado"
            });
        }

        res.status(200).json({
            ok: true,
            mensaje: "Diagnóstico actualizado correctamente",
            data: diagnostico
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            ok: false,
            error: "No fue posible actualizar el diagnóstico"
        });
    }
};

export const eliminarDiagnostico = async (req, res) => {
    try {
        const eliminado = await eliminar(req.params.id);

        if (!eliminado) {
            return res.status(404).json({
                ok: false,
                error: "Diagnóstico no encontrado"
            });
        }

        res.status(200).json({
            ok: true,
            mensaje: "Diagnóstico eliminado correctamente"
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            ok: false,
            error: "No fue posible eliminar el diagnóstico"
        });
    }
};