import db from "../config/firebase.js";

export const DIAS_PARA_RETIRAR = 3;

const TRANSICIONES_VALIDAS = {
    pendiente: ["listo", "cancelado"],
    listo: ["entregado", "cancelado"]
};

const ordenarRecientes = (lista) =>
    lista.sort((a, b) => new Date(b.fechaPedido || 0) - new Date(a.fechaPedido || 0));

// Crear un nuevo pedido apartando existencias de inventario
export const crearPedido = async (datos) => {
    const { clienteUid, clienteNombre, clienteEmail, productos, tipo } = datos;

    return await db.runTransaction(async (transaction) => {
        const productosAgrupados = new Map();
        for (const item of productos) {
            const id = item.productoId.trim();
            const cantidad = Number(item.cantidad);
            productosAgrupados.set(id, (productosAgrupados.get(id) || 0) + cantidad);
        }

        const productosProcesados = [];
        const productosPedido = [];
        let total = 0;

        for (const [productoId, cantidad] of productosAgrupados) {
            const productoRef = db.collection("productos").doc(productoId);
            const productoDoc = await transaction.get(productoRef);

            if (!productoDoc.exists || productoDoc.data().activo === false) {
                throw new Error(`PRODUCTO_NO_ENCONTRADO:${productoId}`);
            }

            const producto = productoDoc.data();
            const stockActual = Number(producto.stock || 0);
            const precio = Number(producto.precio || 0);

            if (cantidad > stockActual) {
                throw new Error(
                    `STOCK_INSUFICIENTE:${producto.nombre || productoId}:${stockActual}`
                );
            }

            const subtotal = Number((precio * cantidad).toFixed(2));
            productosPedido.push({
                productoId,
                nombre: producto.nombre || "",
                cantidad,
                precioUnitario: precio,
                subtotal
            });
            productosProcesados.push({ productoRef, stockActual, cantidad });
            total += subtotal;
        }

        for (const item of productosProcesados) {
            transaction.update(item.productoRef, {
                stock: item.stockActual - item.cantidad,
                fechaActualizacion: new Date().toISOString()
            });
        }

        total = Number(total.toFixed(2));
        const esEnLinea = tipo === "en_linea";
        const ahora = new Date().toISOString();
        const pedidoRef = db.collection("pedidos").doc();

        const limiteRetiro = tipo === "retiro"
            ? new Date(Date.now() + DIAS_PARA_RETIRAR * 24 * 60 * 60 * 1000).toISOString()
            : null;

        const pedido = {
            clienteUid,
            clienteNombre: clienteNombre || "Cliente",
            clienteEmail: clienteEmail || "",
            productos: productosPedido,
            total,
            tipo,
            estado: "pendiente",
            pagado: esEnLinea,
            metodoPago: esEnLinea ? "En línea (prueba)" : "Pendiente",
            fechaPedido: ahora,
            fechaActualizacion: ahora,
            ...(limiteRetiro ? { fechaLimite: limiteRetiro } : {})
        };

        transaction.set(pedidoRef, pedido);
        return { id: pedidoRef.id, ...pedido };
    });
};

// Obtener pedidos de un cliente específico
export const obtenerPorCliente = async (clienteUid) => {
    const snap = await db.collection("pedidos").where("clienteUid", "==", clienteUid).get();
    return ordenarRecientes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
};

// Obtener todos los pedidos con filtro opcional por estado
export const obtenerTodos = async (filtroEstado) => {
    const ref = db.collection("pedidos");
    const query = filtroEstado ? ref.where("estado", "==", filtroEstado) : ref;
    const snap = await query.get();
    return ordenarRecientes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
};

// Obtener un pedido por su ID
export const obtenerPorId = async (id) => {
    const doc = await db.collection("pedidos").doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
};

// Cancela pedidos de retiro vencidos no pagados devolviendo su inventario
export const vencerPedidosAntiguos = async () => {
    const snapshot = await db.collection("pedidos").where("tipo", "==", "retiro").get();
    const ahoraMs = Date.now();
    const plazoMs = DIAS_PARA_RETIRAR * 24 * 60 * 60 * 1000;

    for (const doc of snapshot.docs) {
        const p = doc.data();
        if (p.tipo !== "retiro" || p.pagado === true) continue;
        if (p.estado !== "pendiente" && p.estado !== "listo") continue;

        const limiteMs = p.fechaLimite
            ? new Date(p.fechaLimite).getTime()
            : new Date(p.fechaPedido).getTime() + plazoMs;

        if (Number.isNaN(limiteMs) || limiteMs >= ahoraMs) continue;

        try {
            await cambiarEstado(doc.id, "cancelado", null, "Vencido: no se retiró a tiempo");
        } catch (error) {
            console.error(`Error al vencer pedido ${doc.id}:`, error.message);
        }
    }
};

// Cambiar estado del pedido controlando transiciones, inventario y registro de venta
export const cambiarEstado = async (id, nuevoEstado, metodoPagoEntrega, motivoCancelacion) => {
    return await db.runTransaction(async (transaction) => {
        const pedidoRef = db.collection("pedidos").doc(id);
        const pedidoDoc = await transaction.get(pedidoRef);

        if (!pedidoDoc.exists) throw new Error("PEDIDO_NO_ENCONTRADO");

        const pedido = pedidoDoc.data();
        const transicionesValidas = TRANSICIONES_VALIDAS[pedido.estado] || [];
        if (!transicionesValidas.includes(nuevoEstado)) {
            throw new Error("TRANSICION_INVALIDA");
        }

        const productosRestaurar = [];
        if (nuevoEstado === "cancelado") {
            for (const item of (pedido.productos || [])) {
                const prodRef = db.collection("productos").doc(item.productoId);
                const prodDoc = await transaction.get(prodRef);
                if (prodDoc.exists) {
                    productosRestaurar.push({
                        ref: prodRef,
                        stockActual: Number(prodDoc.data().stock || 0),
                        cantidad: Number(item.cantidad || 0)
                    });
                }
            }
        }

        const ahora = new Date().toISOString();

        if (nuevoEstado === "cancelado") {
            for (const item of productosRestaurar) {
                transaction.update(item.ref, {
                    stock: item.stockActual + item.cantidad,
                    fechaActualizacion: ahora
                });
            }
            const actualizacion = {
                estado: "cancelado",
                fechaActualizacion: ahora,
                ...(motivoCancelacion ? { motivoCancelacion } : {})
            };
            transaction.update(pedidoRef, actualizacion);
            return { pedido: { id, ...pedido, ...actualizacion } };
        }

        if (nuevoEstado === "entregado") {
            const metodoFinal = pedido.pagado
                ? pedido.metodoPago
                : (metodoPagoEntrega || "Efectivo");

            const ventaRef = db.collection("ventas").doc();
            const venta = {
                cliente: pedido.clienteNombre || "Cliente",
                correoCliente: pedido.clienteEmail || "",
                productos: pedido.productos || [],
                metodoPago: metodoFinal,
                total: Number(pedido.total || 0),
                fechaVenta: ahora,
                origen: "pedido",
                pedidoId: id
            };

            transaction.set(ventaRef, venta);

            const actualizacion = {
                estado: "entregado",
                pagado: true,
                metodoPago: metodoFinal,
                ventaId: ventaRef.id,
                fechaActualizacion: ahora
            };

            transaction.update(pedidoRef, actualizacion);
            return {
                pedido: { id, ...pedido, ...actualizacion },
                venta: { id: ventaRef.id, ...venta }
            };
        }

        const actualizacion = {
            estado: "listo",
            fechaActualizacion: ahora
        };
        transaction.update(pedidoRef, actualizacion);
        return { pedido: { id, ...pedido, ...actualizacion } };
    });
};
