import {
    obtenerTodas,
    obtenerPorPropietario,
    obtenerPorId,
    crear,
    actualizar,
    eliminar
} from "../services/mascotas.service.js";

import { validarMascota } from "../validators/mascota.validator.js";

// req.userRole lo carga el middleware cargarRol (ver app.js).
// - Personal (Administrador/Recepcionista/Veterinario): ve y gestiona
//   todas las mascotas de la clínica.
// - Cliente: solo ve y gestiona las mascotas cuyo propietarioUid es el
//   suyo. Las mascotas que registra quedan ligadas a su cuenta.
const esCliente = (req) => req.userRole === "Cliente";

const perteneceAlUsuario = (mascota, req) =>
    !esCliente(req) || mascota.propietarioUid === req.user.uid;

// Obtener todas las mascotas (o solo las del Cliente logueado)
export const obtenerMascotas = async (req, res) => {
    try {
        const mascotas = esCliente(req)
            ? await obtenerPorPropietario(req.user.uid)
            : await obtenerTodas();

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

        // A un Cliente se le responde 404 (no 403) para no revelar que
        // existe una mascota ajena con ese id.
        if (!mascota || !perteneceAlUsuario(mascota, req)) {
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

        const datos = { ...req.body };

        // Un Cliente siempre registra la mascota a su propio nombre.
        if (esCliente(req)) {
            datos.propietarioUid = req.user.uid;
            datos.propietarioEmail = req.user.email || "";
        }

        const nuevaMascota = await crear(datos);

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

        const existente = await obtenerPorId(id);

        if (!existente || !perteneceAlUsuario(existente, req)) {
            return res.status(404).json({
                ok: false,
                message: "Mascota no encontrada."
            });
        }

        const datos = { ...req.body };
        delete datos.id;

        // Un Cliente no puede "regalar" su mascota a otra cuenta.
        if (esCliente(req)) {
            delete datos.propietarioUid;
            delete datos.propietarioEmail;
        }

        const mascota = await actualizar(id, datos);

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

        const existente = await obtenerPorId(id);

        if (!existente || !perteneceAlUsuario(existente, req)) {
            return res.status(404).json({
                ok: false,
                message: "Mascota no encontrada."
            });
        }

        await eliminar(id);

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
