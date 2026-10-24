// Genera una descripción legible de los productos comprados en un pedido
export function describirPedido(pedido) {
    const productos = pedido?.productos;
    if (!productos || !Array.isArray(productos) || productos.length === 0) {
        return "tu compra";
    }

    const primero = (productos[0]?.nombre || "producto").trim();

    if (productos.length === 1) {
        return primero;
    }

    if (productos.length === 2) {
        const segundo = (productos[1]?.nombre || "producto").trim();
        return `${primero} y ${segundo}`;
    }

    const restantes = productos.length - 1;
    return `${primero} y ${restantes} productos más`;
}
