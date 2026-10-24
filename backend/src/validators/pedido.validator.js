// Validador para la creación de nuevos pedidos en la tienda
export const validarPedido = (datos = {}) => {
    const { productos, tipo } = datos;

    if (!Array.isArray(productos) || productos.length === 0) {
        return "El pedido debe contener al menos un producto.";
    }

    for (const item of productos) {
        if (!item || typeof item !== "object") {
            return "Formato de producto inválido.";
        }

        if (!item.productoId || typeof item.productoId !== "string" || item.productoId.trim() === "") {
            return "El ID del producto es obligatorio.";
        }

        const cantidad = Number(item.cantidad);

        if (!Number.isInteger(cantidad) || cantidad <= 0) {
            return "La cantidad debe ser un número entero mayor a 0.";
        }

        if (cantidad > 20) {
            return "La cantidad máxima por producto es de 20 unidades.";
        }
    }

    if (!tipo || (tipo !== "retiro" && tipo !== "en_linea")) {
        return "El tipo de pedido debe ser 'retiro' o 'en_linea'.";
    }

    return null;
};
