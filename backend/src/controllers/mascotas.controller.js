/*import {
    obtenerTodas,
    obtenerPorId,
    crear,
    actualizar,
    eliminar
} from "../services/mascotas.service.js";

export const obtenerMascotas = (req, res) => {
    //const mascotas = obtenerTodas();
    //las funciones del servicio ahora son asíncronas
    const mascotas = await obtenerTodas();
    res.json({
        ok: true,
        data: mascotas
    });
};

export const obtenerMascotaPorId = (req, res) => {

    const { id } = req.params;

    const mascota = obtenerPorId(id);

    res.json({
        ok: true,
        data: mascota
    });

};

export const crearMascota = (req, res) => {

    const nuevaMascota = crear(req.body);

    res.status(201).json({
        ok: true,
        data: nuevaMascota
    });

};

export const actualizarMascota = (req, res) => {

    const { id } = req.params;

    const mascota = actualizar(id, req.body);

    res.json({
        ok: true,
        data: mascota
    });

};

export const eliminarMascota = (req, res) => {

    const { id } = req.params;

    eliminar(id);

    res.json({
        ok: true,
        message: "Mascota eliminada correctamente"
    });

};*/
import {
    obtenerTodas,
    obtenerPorId,
    crear,
    actualizar,
    eliminar
} from "../services/mascotas.service.js";

// Obtener todas las mascotas
export const obtenerMascotas = async (req, res) => {
    try {

        const mascotas = await obtenerTodas();

        res.json({
            ok: true,
            data: mascotas
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            message: "Error al obtener las mascotas",
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
                message: "Mascota no encontrada"
            });
        }

        res.json({
            ok: true,
            data: mascota
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            message: "Error al obtener la mascota",
            error: error.message
        });

    }
};

// Crear mascota
export const crearMascota = async (req, res) => {
    try {

        const nuevaMascota = await crear(req.body);

        res.status(201).json({
            ok: true,
            data: nuevaMascota
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            message: "Error al crear la mascota",
            error: error.message
        });

    }
};

// Actualizar mascota
export const actualizarMascota = async (req, res) => {
    try {

        const { id } = req.params;

        const mascota = await actualizar(id, req.body);

        if (!mascota) {
            return res.status(404).json({
                ok: false,
                message: "Mascota no encontrada"
            });
        }

        res.json({
            ok: true,
            data: mascota
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            message: "Error al actualizar la mascota",
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
                message: "Mascota no encontrada"
            });
        }

        res.json({
            ok: true,
            message: "Mascota eliminada correctamente"
        });

    } catch (error) {

        res.status(500).json({
            ok: false,
            message: "Error al eliminar la mascota",
            error: error.message
        });

    }
};