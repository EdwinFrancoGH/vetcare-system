// Utilidades para validar y reordenar productos de un pedido anterior

// Analiza los productos de un pedido contra el catálogo actual
export function procesarProductosReordenar(productosPedido = [], catalogo = []) {
    const noDisponibles = [];
    const ajustados = [];
    const paraAgregar = [];

    for (const item of productosPedido) {
        const prod = catalogo.find((p) => p.id === item.productoId);
        const stock = Number(prod?.stock || 0);

        if (!prod || stock <= 0) {
            noDisponibles.push(item.nombre || "Producto sin nombre");
            continue;
        }

        const pedidoCant = Number(item.cantidad) || 1;
        const tope = Math.min(stock, 20);
        const cantidadFinal = Math.min(pedidoCant, tope);

        if (cantidadFinal < pedidoCant) {
            ajustados.push({
                nombre: prod.nombre,
                pedido: pedidoCant,
                agregado: cantidadFinal
            });
        }

        paraAgregar.push({
            producto: prod,
            cantidad: cantidadFinal
        });
    }

    return {
        paraAgregar,
        noDisponibles,
        ajustados
    };
}

// Genera el texto explicativo de productos no disponibles o con stock ajustado
export function formatearMensajeAjustes(noDisponibles = [], ajustados = []) {
    const partes = [];

    if (noDisponibles.length > 0) {
        partes.push(`No disponibles: ${noDisponibles.join(", ")}`);
    }

    if (ajustados.length > 0) {
        const detalle = ajustados
            .map((a) => `${a.nombre} (${a.agregado} de ${a.pedido})`)
            .join(", ");
        partes.push(`Stock ajustado: ${detalle}`);
    }

    return `Se agregaron productos a tu carrito con cambios. ${partes.join(". ")}.`;
}
