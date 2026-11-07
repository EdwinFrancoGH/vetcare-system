import {
    obtenerTodas,
    obtenerPorId,
    crearVenta,
    actualizarEstadoFactura
} from "../services/ventas.service.js";

import { enviarFacturaVenta } from "../utils/mailer.js";
import { resolverFacturaVenta } from "../utils/factura-idempotente.js";

// Formato de correo básico para validar antes de intentar el envío
// (no reemplaza una validación seria, solo evita mandar a algo que
// claramente no es un correo).
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Obtener todas las ventas
export const obtenerVentas = async (req, res) => {
    try {
        const ventas = await obtenerTodas();

        res.status(200).json({
            ok: true,
            message: "Ventas obtenidas correctamente.",
            data: ventas
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener las ventas.",
            error: error.message
        });
    }
};

// Obtener venta por ID
export const obtenerVentaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const venta = await obtenerPorId(id);

        if (!venta) {
            return res.status(404).json({
                ok: false,
                message: "Venta no encontrada."
            });
        }

        res.status(200).json({
            ok: true,
            message: "Venta obtenida correctamente.",
            data: venta
        });

    } catch (error) {
        res.status(500).json({
            ok: false,
            message: "Error al obtener la venta.",
            error: error.message
        });
    }
};

// Registrar nueva venta
export const crearControladorRegistrarVenta = ({
    crearVenta: crearVentaOperacion = crearVenta,
    enviarFactura: enviarFacturaOperacion = enviarFacturaVenta,
    actualizarEstadoFactura: actualizarEstadoFacturaOperacion = actualizarEstadoFactura
} = {}) => async (req, res) => {
    try {
        const { productos, cliente, metodoPago, correoCliente } = req.body;

        // Validar que exista al menos un producto
        if (!Array.isArray(productos) || productos.length === 0) {
            return res.status(400).json({
                ok: false,
                message: "La venta debe contener al menos un producto."
            });
        }

        // Validar cada producto
        for (const item of productos) {
            if (!item.productoId) {
                return res.status(400).json({
                    ok: false,
                    message: "El ID del producto es obligatorio."
                });
            }

            const cantidad = Number(item.cantidad);

            if (!Number.isInteger(cantidad) || cantidad <= 0) {
                return res.status(400).json({
                    ok: false,
                    message: "La cantidad debe ser un número entero mayor a 0."
                });
            }
        }

        // El correo es opcional a nivel de API (por si alguna vez se
        // registra una venta sin factura por correo), pero si viene,
        // tiene que tener forma de correo válida.
        const correoLimpio = (correoCliente || "").trim();

        if (correoLimpio && !PATRON_CORREO.test(correoLimpio)) {
            return res.status(400).json({
                ok: false,
                message: "El correo electrónico del cliente no es válido."
            });
        }

        const resultadoVenta = await crearVentaOperacion({
            productos,
            cliente,
            metodoPago,
            correoCliente: correoLimpio,
            actorUid: req.user.uid,
            idempotencyKey: req.idempotencyKey
        });
        const venta = resultadoVenta.venta;
        res.set('Idempotency-Replayed', String(resultadoVenta.repetido));

        // La factura se envía DESPUÉS de que la venta ya quedó guardada
        // y el inventario ya se descontó: si el correo falla (SMTP sin
        // configurar, credenciales inválidas, etc.) la venta no se
        // pierde ni se revierte, solo se informa que no se pudo enviar.
        const resultadoCorreo = await resolverFacturaVenta({
            resultadoVenta,
            correoDestino: correoLimpio,
            enviarFactura: enviarFacturaOperacion
        });

        if (!resultadoVenta.repetido) {
            try {
                await actualizarEstadoFacturaOperacion(venta.id, resultadoCorreo);
            } catch (errorEstado) {
                console.error("No se pudo guardar el estado de factura:", errorEstado.message);
            }
        }

        res.status(resultadoVenta.repetido ? 200 : 201).json({
            ok: true,
            message: "Venta registrada correctamente.",
            data: venta,
            facturaEnviada: resultadoCorreo.pendiente ? null : resultadoCorreo.enviado,
            facturaMotivo: resultadoCorreo.enviado ? undefined : resultadoCorreo.motivo
        });

    } catch (error) {

        if (error.message === "IDEMPOTENCY_KEY_REUSED") {
            return res.status(409).json({ ok: false, message: "La clave de solicitud ya se usó con otros datos." });
        }

        // Producto inexistente
        if (error.message.startsWith("PRODUCTO_NO_ENCONTRADO:")) {
            return res.status(404).json({
                ok: false,
                message: "Uno de los productos no fue encontrado."
            });
        }

        // Stock insuficiente
        if (error.message.startsWith("STOCK_INSUFICIENTE:")) {
            const [, nombre, stockActual] = error.message.split(":");

            return res.status(400).json({
                ok: false,
                message: `Stock insuficiente para ${nombre}.`,
                stockActual: Number(stockActual)
            });
        }

        if (error.message.startsWith("PRODUCTO_INVALIDO") || error.message === "TOTAL_INVALIDO") {
            return res.status(400).json({
                ok: false,
                message: "Los datos de productos o cantidades no son válidos."
            });
        }

        res.status(500).json({
            ok: false,
            message: "Error al registrar la venta.",
            error: error.message
        });
    }
};

export const registrarVenta = crearControladorRegistrarVenta();
