import {
    obtenerTodos as obtenerTodosPedidos,
    cambiarEstado as cambiarEstadoService,
    vencerPedidosAntiguos
} from "../services/pedidos.service.js";
import { enviarFacturaVenta } from "../utils/mailer.js";

// Listar todos los pedidos con filtro opcional por estado
export const obtenerPedidos = async (req, res) => {
    try {
        try {
            await vencerPedidosAntiguos();
        } catch (errorVencimiento) {
            console.error("Error al vencer pedidos antiguos:", errorVencimiento.message);
        }

        const { estado } = req.query;
        const pedidos = await obtenerTodosPedidos(estado);

        return res.status(200).json({
            ok: true,
            message: "Pedidos obtenidos correctamente.",
            data: pedidos
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error al obtener los pedidos.",
            error: error.message
        });
    }
};

// Cambiar estado de un pedido (personal)
export const actualizarEstadoPedido = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado, metodoPago, motivoCancelacion } = req.body;

        if (!estado) {
            return res.status(400).json({
                ok: false,
                message: "El nuevo estado es obligatorio."
            });
        }

        const motivo = estado === "cancelado"
            ? (motivoCancelacion || "Cancelado por la clínica")
            : null;

        const resultado = await cambiarEstadoService(id, estado, metodoPago, motivo);

        let facturaEnviada;
        let facturaMotivo;

        if (estado === "entregado" && resultado.pedido.clienteEmail) {
            const resultadoCorreo = await enviarFacturaVenta({
                correoDestino: resultado.pedido.clienteEmail,
                venta: resultado.venta
            });

            facturaEnviada = resultadoCorreo.enviado;
            facturaMotivo = resultadoCorreo.enviado ? undefined : resultadoCorreo.motivo;
        }

        return res.status(200).json({
            ok: true,
            message: `Pedido actualizado a ${estado} correctamente.`,
            data: resultado.pedido,
            ...(resultado.venta ? { venta: resultado.venta } : {}),
            ...(facturaEnviada !== undefined ? { facturaEnviada, facturaMotivo } : {})
        });
    } catch (error) {
        if (error.message === "PEDIDO_NO_ENCONTRADO") {
            return res.status(404).json({
                ok: false,
                message: "Pedido no encontrado."
            });
        }

        if (error.message === "TRANSICION_INVALIDA") {
            return res.status(400).json({
                ok: false,
                message: "La transición de estado no es válida para el estado actual del pedido."
            });
        }

        return res.status(500).json({
            ok: false,
            message: "Error al actualizar el estado del pedido.",
            error: error.message
        });
    }
};
