import db from "../config/firebase.js";

// Obtener inventario completo
export const obtenerInventario = async () => {
    const snapshot = await db.collection("productos").get();

    return snapshot.docs.map(doc => {
        const producto = doc.data();

        return {
            id: doc.id,
            nombre: producto.nombre,
            categoria: producto.categoria,
            stock: Number(producto.stock),
            stockMinimo: Number(producto.stockMinimo),
            estado:
                Number(producto.stock) <= Number(producto.stockMinimo)
                    ? "STOCK_BAJO"
                    : "DISPONIBLE"
        };
    });
};

// Registrar entrada de inventario
export const registrarEntrada = async (productoId, cantidad) => {
    const docRef = db.collection("productos").doc(productoId);

    const resultado = await db.runTransaction(async transaction => {
        const doc = await transaction.get(docRef);

        if (!doc.exists) {
            return null;
        }

        const producto = doc.data();
        const stockActual = Number(producto.stock);
        const nuevoStock = stockActual + Number(cantidad);

        transaction.update(docRef, {
            stock: nuevoStock,
            fechaActualizacion: new Date().toISOString()
        });

        return {
            id: doc.id,
            nombre: producto.nombre,
            stockAnterior: stockActual,
            cantidad: Number(cantidad),
            stockActual: nuevoStock
        };
    });

    return resultado;
};

// Registrar salida de inventario
export const registrarSalida = async (productoId, cantidad) => {
    const docRef = db.collection("productos").doc(productoId);

    const resultado = await db.runTransaction(async transaction => {
        const doc = await transaction.get(docRef);

        if (!doc.exists) {
            return {
                error: "PRODUCTO_NO_ENCONTRADO"
            };
        }

        const producto = doc.data();
        const stockActual = Number(producto.stock);
        const cantidadNumero = Number(cantidad);

        if (cantidadNumero > stockActual) {
            return {
                error: "STOCK_INSUFICIENTE",
                stockActual
            };
        }

        const nuevoStock = stockActual - cantidadNumero;

        transaction.update(docRef, {
            stock: nuevoStock,
            fechaActualizacion: new Date().toISOString()
        });

        return {
            id: doc.id,
            nombre: producto.nombre,
            stockAnterior: stockActual,
            cantidad: cantidadNumero,
            stockActual: nuevoStock
        };
    });

    return resultado;
};