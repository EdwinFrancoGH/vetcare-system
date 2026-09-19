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

        // Primero leer todos los productos
        for (const item of productos) {
            const productoRef = db.collection("productos").doc(item.productoId);
            const productoDoc = await transaction.get(productoRef);

            if (!productoDoc.exists) {
                throw new Error(
                    `PRODUCTO_NO_ENCONTRADO:${item.productoId}`
                );
            }

            const producto = productoDoc.data();
            const cantidad = Number(item.cantidad);
            const stockActual = Number(producto.stock);
            const precio = Number(producto.precio);

            if (cantidad > stockActual) {
                throw new Error(
                    `STOCK_INSUFICIENTE:${producto.nombre}:${stockActual}`
                );
            }

            const subtotal = precio * cantidad;

            productosVenta.push({
                productoId: productoDoc.id,
                nombre: producto.nombre,
                cantidad,
                precioUnitario: precio,
                subtotal
            });

            total += subtotal;
        }

        // Descontar existencias
        for (const item of productosVenta) {
            const productoRef = db
                .collection("productos")
                .doc(item.productoId);

            const productoDoc = await transaction.get(productoRef);
            const stockActual = Number(productoDoc.data().stock);

            transaction.update(productoRef, {
                stock: stockActual - item.cantidad,
                fechaActualizacion: new Date().toISOString()
            });
        }

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