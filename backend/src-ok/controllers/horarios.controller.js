import {
    obtenerTodos,
    obtenerPorVeterinario,
    guardar,
    eliminar
} from "../services/horarios.service.js";

import { validarHorario } from "../validators/horario.validator.js";

// Obtener el horario semanal de todos los veterinarios
export const obtenerHorarios = async (req, res) => {
    try {
        const horarios = await obtenerTodos();

        res.status(200).json({
            ok: true,
            message: "Horarios obtenidos correctamente.",
            data: horarios
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener los horarios.",
            error: error.message
        });
    }
};

// Obtener el horario semanal de un veterinario específico
export const obtenerHorarioPorVeterinario = async (req, res) => {
    try {
        const { veterinario } = req.params;

        const horario = await obtenerPorVeterinario(veterinario);

        if (!horario) {
            return res.status(404).json({
                ok: false,
                message: "Ese veterinario todavía no tiene un horario de atención configurado."
            });
        }

        res.status(200).json({
            ok: true,
            message: "Horario obtenido correctamente.",
            data: horario
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener el horario.",
            error: error.message
        });
    }
};

// Crear o actualizar el horario semanal de un veterinario (upsert)
export const guardarHorario = async (req, res) => {
    try {
        const { veterinario } = req.params;

        const datos = { ...req.body, veterinario };

        const errorValidacion = validarHorario(datos);

        if (errorValidacion) {
            return res.status(400).json({
                ok: false,
                message: errorValidacion
            });
        }

        const horario = await guardar(veterinario, datos);

        res.status(200).json({
            ok: true,
            message: "Horario guardado correctamente.",
            data: horario
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al guardar el horario.",
            error: error.message
        });
    }
};

// Eliminar el horario semanal de un veterinario
export const eliminarHorario = async (req, res) => {
    try {
        const { veterinario } = req.params;

        await eliminar(veterinario);

        res.status(200).json({
            ok: true,
            message: "Horario eliminado correctamente."
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al eliminar el horario.",
            error: error.message
        });
    }
};
