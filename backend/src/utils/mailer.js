import nodemailer from "nodemailer";

// Envío de la factura por correo cuando se registra una venta. Usa
// credenciales SMTP configuradas por variables de entorno (ver
// backend/.env.example: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y,
// opcional, SMTP_FROM).
//
// IMPORTANTE: si esas variables no están configuradas, la venta se
// registra igual (no depende de que el correo se envíe) — solo se
// omite el envío y se avisa en la consola del servidor. Así, si todavía
// no has configurado un proveedor de correo, el módulo de Ventas sigue
// funcionando exactamente igual que antes.
let transportadorCache;

function obtenerTransportador() {
    if (transportadorCache !== undefined) return transportadorCache;

    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        transportadorCache = null;
        return transportadorCache;
    }

    const puerto = Number(SMTP_PORT) || 587;

    transportadorCache = nodemailer.createTransport({
        host: SMTP_HOST,
        port: puerto,
        // 465 usa TLS implícito; el resto (587, 25, etc.) usa STARTTLS.
        secure: puerto === 465,
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS
        }
    });

    return transportadorCache;
}

function filaProducto(producto) {
    return `
        <tr>
            <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;">${producto.nombre}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center;">${producto.cantidad}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:right;">$${Number(producto.precioUnitario).toFixed(2)}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:right;">$${Number(producto.subtotal).toFixed(2)}</td>
        </tr>`;
}

function construirHtmlFactura(venta) {
    const filas = (venta.productos || []).map(filaProducto).join("");
    const fecha = venta.fechaVenta
        ? new Date(venta.fechaVenta).toLocaleString("es-SV")
        : "-";

    return `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937;">
            <h2 style="color:#1e3a8a;margin-bottom:4px;">VetCare</h2>
            <p style="margin-top:0;color:#6b7280;">Factura de tu compra</p>

            <p>Gracias por tu compra${venta.cliente ? `, ${venta.cliente}` : ""}.</p>

            <p style="font-size:13px;color:#6b7280;">
                Venta #${venta.id}<br />
                Fecha: ${fecha}<br />
                Método de pago: ${venta.metodoPago}
            </p>

            <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;">
                <thead>
                    <tr style="background:#f3f4f6;">
                        <th style="padding:6px 10px;text-align:left;">Producto</th>
                        <th style="padding:6px 10px;text-align:center;">Cant.</th>
                        <th style="padding:6px 10px;text-align:right;">Precio</th>
                        <th style="padding:6px 10px;text-align:right;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${filas}
                </tbody>
            </table>

            <p style="text-align:right;font-size:18px;font-weight:bold;margin-top:12px;">
                Total: $${Number(venta.total).toFixed(2)}
            </p>

            <p style="font-size:12px;color:#9ca3af;margin-top:24px;">
                Este correo fue generado automáticamente por VetCare. No respondas a este mensaje.
            </p>
        </div>
    `;
}

// Intenta enviar la factura de una venta ya registrada. Nunca lanza: si
// algo falla (SMTP no configurado, credenciales inválidas, correo
// vacío, error de red), devuelve { enviado: false, motivo } para que el
// controlador pueda informarlo sin que la venta ya guardada se vea
// afectada.
export const enviarFacturaVenta = async ({ correoDestino, venta }) => {
    if (!correoDestino) {
        return { enviado: false, motivo: "SIN_CORREO" };
    }

    const transportador = obtenerTransportador();

    if (!transportador) {
        console.warn(
            "[mailer] SMTP no configurado (ver backend/.env.example) — la venta se registró, pero no se envió la factura por correo."
        );
        return { enviado: false, motivo: "SMTP_NO_CONFIGURADO" };
    }

    try {
        await transportador.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: correoDestino,
            subject: `VetCare - Factura de tu compra (#${venta.id})`,
            html: construirHtmlFactura(venta)
        });

        return { enviado: true };
    } catch (error) {
        console.error("[mailer] Error enviando la factura por correo:", error);
        return { enviado: false, motivo: "ERROR_ENVIO", detalle: error.message };
    }
};
