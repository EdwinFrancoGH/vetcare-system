import db from "../config/firebase.js";
import { crearClavePersistente, fechaExpiracionIdempotencia } from "../utils/idempotency.js";

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

export const actualizarEstadoFactura = async (id, resultado) => {
    const estado = resultado.enviado ? "enviada" : "fallida";
    await db.collection("ventas").doc(id).update({
        facturaEstado: estado,
        ...(resultado.enviado ? {} : { facturaMotivo: resultado.motivo || "No se pudo confirmar el envío." })
    });
};

// Crear una venta y descontar existencias
export const crearVenta = async (datos) => crearVentaConDb(datos, db);

export const crearVentaConDb = async (datos, database) => {
    const {
        productos,
        cliente = "",
        metodoPago = "Efectivo",
        correoCliente = "",
        actorUid,
        idempotencyKey
    } = datos;
    const clave = crearClavePersistente({
        scope: "venta",
        actorUid,
        key: idempotencyKey,
        payload: { productos, cliente, metodoPago, correoCliente }
    });

    const resultado = await database.runTransaction(async transaction => {
        const claveRef = database.collection("idempotencia").doc(clave.id);
        const claveDoc = await transaction.get(claveRef);
        if (claveDoc.exists) {
            const guardado = claveDoc.data();
            if (guardado.payloadHash !== clave.payloadHash) throw new Error("IDEMPOTENCY_KEY_REUSED");
            const ventaDoc = await transaction.get(database.collection("ventas").doc(guardado.resourceId));
            if (!ventaDoc.exists) throw new Error("IDEMPOTENCY_RESULT_MISSING");
            return { venta: { id: ventaDoc.id, ...ventaDoc.data() }, repetido: true };
        }
        const ventaExistente = await transaction.get(database.collection("ventas").where("idempotencyId", "==", clave.id).limit(1));
        if (!ventaExistente.empty) {
            const ventaDoc = ventaExistente.docs[0];
            const guardado = ventaDoc.data();
            if (guardado.idempotencyPayloadHash !== clave.payloadHash) throw new Error("IDEMPOTENCY_KEY_REUSED");
            return { venta: { id: ventaDoc.id, ...guardado }, repetido: true };
        }

        const productosVenta = [];
        let total = 0;
        // Algoritmo para evitar productos duplicados y acumular cantidades
        const productosAgrupados = new Map();

        for (const item of productos) {
            const cantidad = Number(item.cantidad);
            if (!item?.productoId || !Number.isSafeInteger(cantidad) || cantidad <= 0) {
                throw new Error("PRODUCTO_INVALIDO");
            }

            if (productosAgrupados.has(item.productoId)) {
                const cantidadAcumulada = productosAgrupados.get(item.productoId) + cantidad;
                if (!Number.isSafeInteger(cantidadAcumulada)) throw new Error("PRODUCTO_INVALIDO");
                productosAgrupados.set(item.productoId, cantidadAcumulada);
            } else {
                productosAgrupados.set(item.productoId, cantidad);
            }
        }

        // Leer y validar todos los productos antes de modificar el inventario
        const productosProcesados = [];

        for (const [productoId, cantidad] of productosAgrupados) {
            const productoRef = database.collection("productos").doc(productoId);
            const productoDoc = await transaction.get(productoRef);

            if (!productoDoc.exists) {
                throw new Error(
                    `PRODUCTO_NO_ENCONTRADO:${productoId}`
                );
            }

            const producto = productoDoc.data();
            const stockActual = Number(producto.stock);
            const precio = Number(producto.precio);

            if (!Number.isSafeInteger(stockActual) || stockActual < 0 || !Number.isFinite(precio) || precio < 0) {
                throw new Error(`PRODUCTO_INVALIDO:${productoId}`);
            }

            // Algoritmo de validación de existencias
            if (cantidad > stockActual) {
                throw new Error(
                    `STOCK_INSUFICIENTE:${producto.nombre}:${stockActual}`
                );
            }

            const subtotal = Number(
                (precio * cantidad).toFixed(2)
            );
            if (!Number.isFinite(subtotal)) throw new Error(`PRODUCTO_INVALIDO:${productoId}`);

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
            if (!Number.isFinite(total)) throw new Error("TOTAL_INVALIDO");
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
        const ventaRef = database.collection("ventas").doc();

        const venta = {
            cliente,
            correoCliente,
            productos: productosVenta,
            metodoPago,
            total,
            fechaVenta: new Date().toISOString(),
            facturaEstado: correoCliente ? "pendiente" : "sin_correo",
            idempotencyId: clave.id,
            idempotencyPayloadHash: clave.payloadHash
        };

        transaction.set(ventaRef, venta);
        const ahora = new Date().toISOString();
        transaction.create(claveRef, {
            payloadHash: clave.payloadHash,
            resourceId: ventaRef.id,
            resourceType: "venta",
            createdAt: new Date(ahora),
            expiresAt: fechaExpiracionIdempotencia(new Date(ahora))
        });

        return {
            venta: { id: ventaRef.id, ...venta },
            repetido: false
        };
    });

    return resultado;
};
