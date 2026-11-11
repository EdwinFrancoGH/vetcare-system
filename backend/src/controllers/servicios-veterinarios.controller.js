import {
    actualizarServicioVeterinario,
    cambiarEstadoServicioVeterinario,
    crearServicioVeterinario,
    ErrorServicioVeterinario,
    listarServiciosVeterinarios,
} from "../services/servicios-veterinarios.service.js";
import {
    normalizarDatosServicioVeterinario,
    validarEstadoServicioVeterinario,
    validarServicioVeterinario,
} from "../validators/servicio-veterinario.validator.js";

const respuestaError = (res, error, mensaje) => {
    if (error instanceof ErrorServicioVeterinario && error.codigo === "NOMBRE_DUPLICADO") {
        return res.status(409).json({ ok: false, message: "Ya existe un servicio con ese nombre." });
    }
    return res.status(500).json({ ok: false, message: mensaje });
};

export const crearControladorServiciosVeterinarios = ({
    listar = listarServiciosVeterinarios,
    crear = crearServicioVeterinario,
    actualizar = actualizarServicioVeterinario,
    cambiarEstado = cambiarEstadoServicioVeterinario,
} = {}) => ({
    listar: async (req, res) => {
        try {
            const data = await listar({ incluirInactivos: req.userRole === "Administrador" });
            const resultado = req.userRole === "Administrador"
                ? data
                : data.map(({ id, nombre, descripcion, precioCentavos, moneda, activo, createdAt, updatedAt }) => ({
                    id, nombre, descripcion, precioCentavos, moneda, activo, createdAt, updatedAt,
                }));
            return res.status(200).json({ ok: true, data: resultado });
        } catch (error) {
            return respuestaError(res, error, "No se pudieron obtener los servicios veterinarios.");
        }
    },

    crear: async (req, res) => {
        const errorValidacion = validarServicioVeterinario(req.body);
        if (errorValidacion) return res.status(400).json({ ok: false, message: errorValidacion });
        try {
            const datos = normalizarDatosServicioVeterinario(req.body);
            const data = await crear(datos, req.user.uid);
            return res.status(201).json({ ok: true, message: "Servicio veterinario creado.", data });
        } catch (error) {
            return respuestaError(res, error, "No se pudo crear el servicio veterinario.");
        }
    },

    actualizar: async (req, res) => {
        const errorValidacion = validarServicioVeterinario(req.body, true);
        if (errorValidacion) return res.status(400).json({ ok: false, message: errorValidacion });
        try {
            const datos = normalizarDatosServicioVeterinario(req.body);
            const data = await actualizar(req.params.id, datos, req.user.uid);
            if (!data) return res.status(404).json({ ok: false, message: "Servicio veterinario no encontrado." });
            return res.status(200).json({ ok: true, message: "Servicio veterinario actualizado.", data });
        } catch (error) {
            return respuestaError(res, error, "No se pudo actualizar el servicio veterinario.");
        }
    },

    cambiarEstado: async (req, res) => {
        const errorValidacion = validarEstadoServicioVeterinario(req.body);
        if (errorValidacion) return res.status(400).json({ ok: false, message: errorValidacion });
        try {
            const data = await cambiarEstado(req.params.id, req.body.activo, req.user.uid);
            if (!data) return res.status(404).json({ ok: false, message: "Servicio veterinario no encontrado." });
            return res.status(200).json({ ok: true, message: "Estado del servicio actualizado.", data });
        } catch (error) {
            return respuestaError(res, error, "No se pudo cambiar el estado del servicio veterinario.");
        }
    },
});

const controladores = crearControladorServiciosVeterinarios();
export const obtenerServiciosVeterinarios = controladores.listar;
export const crearServicioVeterinarioController = controladores.crear;
export const actualizarServicioVeterinarioController = controladores.actualizar;
export const cambiarEstadoServicioVeterinarioController = controladores.cambiarEstado;
