import {
    obtenerTodas,
    obtenerPorId,
    crear,
    actualizar,
    eliminar
} from "../services/vacunas.service.js";

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

// Crear vacuna
export const crearVacuna = async (req, res) => {
    try {
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