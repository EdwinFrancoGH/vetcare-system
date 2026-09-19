import db from "../config/firebase.js";

// Obtener todas las ventas
export const obtenerTodas = async () => {
    const snapshot = await db.collection("ventas").get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

// Obtener una venta por ID
export const obtenerPorId = async (id) => {
    const doc = await db.collection("ventas").doc(id).get();

    if (!doc.exists) {
        return null;
    }

    return {
        id: doc.id,
        ...doc.data()
    };
};

// Crear una venta y descontar existencias
export const crearVenta = async (datos) => {
    const { productos, cliente = "", metodoPago = "Efectivo" } = datos;

    const resultado = await db.runTransaction(async transaction => {
        const productosVenta = [];
        let total = 0;
        // Algoritmo para evitar productos duplicados y acumular cantidades
        const productosAgrupados = new Map();

        for (const item of productos) {
            const cantidad = Number(item.cantidad);

            if (productosAgrupados.has(item.productoId)) {
                productosAgrupados.set(
                    item.productoId,
                    productosAgrupados.get(item.productoId) + cantidad
                );
            } else {
                productosAgrupados.set(item.productoId, cantidad);
            }
        }

        // Leer y validar todos los productos antes de modificar el inventario
        const productosProcesados = [];

        for (const [productoId, cantidad] of productosAgrupados) {
            const productoRef = db.collection("productos").doc(productoId);
            const productoDoc = await transaction.get(productoRef);

            if (!productoDoc.exists) {
                throw new Error(
                    `PRODUCTO_NO_ENCONTRADO:${productoId}`
                );
            }

            const producto = productoDoc.data();
            const stockActual = Number(producto.stock);
            const precio = Number(producto.precio);

            // Algoritmo de validación de existencias
            if (cantidad > stockActual) {
                throw new Error(
                    `STOCK_INSUFICIENTE:${producto.nombre}:${stockActual}`
                );
            }

            const subtotal = Number(
                (precio * cantidad).toFixed(2)
            );

            productosVenta.push({
                productoId,
                nombre: producto.nombre,
                cantidad,
                precioUnitario: precio,
                subtotal
            });

            productosProcesados.push({
                productoRef,
                stockActual,
                cantidad
            });

            total += subtotal;
        }

        // Después de terminar TODAS las lecturas,
        // actualizar las existencias
        for (const item of productosProcesados) {
            transaction.update(item.productoRef, {
                stock: item.stockActual - item.cantidad,
                fechaActualizacion: new Date().toISOString()
            });
        }

        total = Number(total.toFixed(2));

        // Crear venta
        const ventaRef = db.collection("ventas").doc();

        const venta = {
            cliente,
            productos: productosVenta,
            metodoPago,
            total,
            fechaVenta: new Date().toISOString()
        };

        transaction.set(ventaRef, venta);

        return {
            id: ventaRef.id,
            ...venta
        };
    });

    return resultado;
};