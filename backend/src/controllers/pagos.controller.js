import {
    aprobarPagoCita,
    listarPagosPendientes,
    rechazarPagoCita,
    ErrorPagoCita,
} from "../services/pagos-citas.service.js";
import {
    validarAprobacionPago,
    validarIdCitaPago,
    validarRechazoPago,
} from "../validators/revision-pago-cita.validator.js";

const mensajesError = {
    NO_AUTORIZADO: [403, "No tienes permiso para revisar pagos."],
    PAGO_NO_ENCONTRADO: [404, "Pago de cita no encontrado."],
    PAGO_YA_APROBADO: [409, "El pago de esta cita ya fue aprobado."],
    PAGO_APROBADO_EXISTENTE: [409, "Ya existe un pago aprobado para esta cita."],
    PAGO_NO_REVISABLE: [409, "El estado actual del pago no permite esta decisión."],
};

const responderError = (res, error, mensaje) => {
    if (error instanceof ErrorPagoCita) {
        const [status, message] = mensajesError[error.codigo] || [409, "No se pudo cambiar el estado del pago."];
        return res.status(status).json({ ok: false, code: error.codigo, message });
    }
    return res.status(500).json({ ok: false, message: mensaje });
};

export const crearControladorPagos = ({
    listar = listarPagosPendientes,
    aprobar = aprobarPagoCita,
    rechazar = rechazarPagoCita,
} = {}) => ({
    pendientes: async (_req, res) => {
        try {
            const data = await listar();
            return res.status(200).json({ ok: true, data });
        } catch (error) {
            return responderError(res, error, "No se pudieron consultar los pagos pendientes.");
        }
    },

    aprobar: async (req, res) => {
        const errorId = validarIdCitaPago(req.params.citaId);
        if (errorId) return res.status(400).json({ ok: false, message: errorId });
        const errorBody = validarAprobacionPago(req.body);
        if (errorBody) return res.status(400).json({ ok: false, message: errorBody });
        try {
            const data = await aprobar({
                citaId: req.params.citaId,
                verificadorUid: req.user.uid,
                verificadorRol: req.userRole,
            });
            return res.status(200).json({ ok: true, message: "Pago de cita aprobado.", data });
        } catch (error) {
            return responderError(res, error, "No se pudo aprobar el pago de la cita.");
        }
    },

    rechazar: async (req, res) => {
        const errorId = validarIdCitaPago(req.params.citaId);
        if (errorId) return res.status(400).json({ ok: false, message: errorId });
        const errorBody = validarRechazoPago(req.body);
        if (errorBody) return res.status(400).json({ ok: false, message: errorBody });
        try {
            const data = await rechazar({
                citaId: req.params.citaId,
                verificadorUid: req.user.uid,
                verificadorRol: req.userRole,
                motivoRechazo: req.body.motivoRechazo.trim(),
            });
            return res.status(200).json({ ok: true, message: "Pago de cita rechazado.", data });
        } catch (error) {
            return responderError(res, error, "No se pudo rechazar el pago de la cita.");
        }
    },
});

const controladores = crearControladorPagos();
export const listarPagosPendientesController = controladores.pendientes;
export const aprobarPagoCitaController = controladores.aprobar;
export const rechazarPagoCitaController = controladores.rechazar;
