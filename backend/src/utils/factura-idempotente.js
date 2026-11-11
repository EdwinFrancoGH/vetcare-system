export const resolverFacturaVenta = async ({ resultadoVenta, correoDestino, enviarFactura }) => {
    if (resultadoVenta.repetido) {
        const venta = resultadoVenta.venta;
        return {
            enviado: venta.facturaEstado === "enviada",
            motivo: venta.facturaMotivo,
            pendiente: venta.facturaEstado === "pendiente"
        };
    }
    return enviarFactura({ correoDestino, venta: resultadoVenta.venta });
};
