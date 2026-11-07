import { consultarPagoCita, ErrorPagoCita, reportarPagoCita } from "../services/pagos-citas.service.js";
import { normalizarReportePagoCita, validarReportePagoCita } from "../validators/pago-cita.validator.js";

const manejarErrorPago = (res, error) => {
    if (!(error instanceof ErrorPagoCita)) {
        return res.status(500).json({ ok: false, message: "No se pudo procesar el pago de la cita." });
    }
    const respuestas = {
        CITA_NO_ENCONTRADA: [404, "Cita no encontrada."],
        CITA_NO_PROPIA: [404, "Cita no encontrada."],
        CITA_NO_COMPLETADA: [409, "Solo se puede reportar el pago de una cita completada."],
        CITA_SIN_TARIFA: [409, "La cita requiere asignación administrativa de servicio y tarifa antes de reportar un pago."],
        PAGO_YA_REPORTADO: [409, "Ya existe un pago reportado o en revisión para esta cita."],
        PAGO_YA_APROBADO: [409, "El pago de esta cita ya fue aprobado y no puede sobrescribirse."],
        PAGO_NO_REPORTABLE: [409, "El estado actual del pago no permite reportar otro intento."],
        PAGO_INCONSISTENTE: [409, "El registro del pago no coincide con esta cita."],
    };
    const [status, message] = respuestas[error.codigo] || [409, "No se puede reportar el pago en el estado actual."];
    return res.status(status).json({ ok: false, code: error.codigo, message });
};

export const crearControladorPagosCitas = ({
    reportar = reportarPagoCita,
    consultar = consultarPagoCita,
} = {}) => ({
    reportar: async (req, res) => {
        if (req.userRole !== "Cliente") {
            return res.status(403).json({ ok: false, message: "Solo el cliente puede reportar el pago de su cita." });
        }
        const errorValidacion = validarReportePagoCita(req.body);
        if (errorValidacion) return res.status(400).json({ ok: false, message: errorValidacion });
        try {
            const datos = normalizarReportePagoCita(req.body);
            const resultado = await reportar({
                citaId: req.params.id,
                clienteUid: req.user.uid,
                ...datos,
            });
            return res.status(201).json({ ok: true, message: "Pago reportado para revisión.", data: resultado.pago });
        } catch (error) {
            return manejarErrorPago(res, error);
        }
    },

    consultar: async (req, res) => {
        try {
            const resultado = await consultar(req.params.id, req.user.uid, req.userRole);
            if (resultado.error === "CITA_NO_ENCONTRADA") {
                return res.status(404).json({ ok: false, message: "Cita no encontrada." });
            }
            if (resultado.error === "NO_AUTORIZADO") {
                const status = req.userRole === "Cliente" ? 404 : 403;
                return res.status(status).json({ ok: false, message: status === 404 ? "Cita no encontrada." : "No tienes permiso para consultar información financiera." });
            }
            return res.status(200).json({ ok: true, data: resultado.pago });
        } catch {
            return res.status(500).json({ ok: false, message: "No se pudo consultar el pago de la cita." });
        }
    },
});

const controladores = crearControladorPagosCitas();
export const reportarPagoCitaController = controladores.reportar;
export const consultarPagoCitaController = controladores.consultar;
