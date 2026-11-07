import db from "../config/firebase.js";
import { crearClavePersistente, fechaExpiracionIdempotencia } from "../utils/idempotency.js";
import { MAX_UNIDADES_POR_PRODUCTO } from "../validators/pedido.validator.js";

export const DIAS_PARA_RETIRAR = 3;

const TRANSICIONES_VALIDAS = {
    pendiente: ["listo", "cancelado"],
    listo: ["entregado", "cancelado"]
};

const ordenarRecientes = (lista) =>
    lista.sort((a, b) => new Date(b.fechaPedido || 0) - new Date(a.fechaPedido || 0));

// Crear un nuevo pedido apartando existencias de inventario
export const crearPedido = async (datos) => crearPedidoConDb(datos, db);

export const crearPedidoConDb = async (datos, database) => {
    const { clienteUid, clienteNombre, clienteEmail, productos, tipo, idempotencyKey } = datos;
    const clave = crearClavePersistente({
        scope: "pedido",
        actorUid: clienteUid,
        key: idempotencyKey,
        payload: { productos, tipo }
    });

    return await database.runTransaction(async (transaction) => {
        const claveRef = database.collection("idempotencia").doc(clave.id);
        const claveDoc = await transaction.get(claveRef);
        if (claveDoc.exists) {
            const guardado = claveDoc.data();
            if (guardado.payloadHash !== clave.payloadHash) throw new Error("IDEMPOTENCY_KEY_REUSED");
            const pedidoDoc = await transaction.get(database.collection("pedidos").doc(guardado.resourceId));
            if (!pedidoDoc.exists) throw new Error("IDEMPOTENCY_RESULT_MISSING");
            return { pedido: { id: pedidoDoc.id, ...pedidoDoc.data() }, repetido: true };
        }
        const pedidoExistente = await transaction.get(database.collection("pedidos").where("idempotencyId", "==", clave.id).limit(1));
        if (!pedidoExistente.empty) {
            const pedidoDoc = pedidoExistente.docs[0];
            const guardado = pedidoDoc.data();
            if (guardado.idempotencyPayloadHash !== clave.payloadHash) throw new Error("IDEMPOTENCY_KEY_REUSED");
            return { pedido: { id: pedidoDoc.id, ...guardado }, repetido: true };
        }

        const productosAgrupados = new Map();
        for (const item of productos) {
            const id = typeof item?.productoId === "string" ? item.productoId.trim() : "";
            const cantidad = Number(item.cantidad);
            if (!id || !Number.isSafeInteger(cantidad) || cantidad <= 0) {
                throw new Error("PRODUCTO_INVALIDO");
            }
            const cantidadAcumulada = (productosAgrupados.get(id) || 0) + cantidad;
            if (!Number.isSafeInteger(cantidadAcumulada) || cantidadAcumulada > MAX_UNIDADES_POR_PRODUCTO) {
                throw new Error("PRODUCTO_INVALIDO");
            }
            productosAgrupados.set(id, cantidadAcumulada);
        }

        const productosProcesados = [];
        const productosPedido = [];
        let total = 0;

        for (const [productoId, cantidad] of productosAgrupados) {
            const productoRef = database.collection("productos").doc(productoId);
            const productoDoc = await transaction.get(productoRef);

            if (!productoDoc.exists || productoDoc.data().activo === false) {
                throw new Error(`PRODUCTO_NO_ENCONTRADO:${productoId}`);
            }

            const producto = productoDoc.data();
            const stockActual = Number(producto.stock);
            const precio = Number(producto.precio);

            if (!Number.isSafeInteger(stockActual) || stockActual < 0 || !Number.isFinite(precio) || precio < 0) {
                throw new Error(`PRODUCTO_INVALIDO:${productoId}`);
            }

            if (cantidad > stockActual) {
                throw new Error(
                    `STOCK_INSUFICIENTE:${producto.nombre || productoId}:${stockActual}`
                );
            }

            const subtotal = Number((precio * cantidad).toFixed(2));
            if (!Number.isFinite(subtotal)) throw new Error(`PRODUCTO_INVALIDO:${productoId}`);
            productosPedido.push({
                productoId,
                nombre: producto.nombre || "",
                cantidad,
                precioUnitario: precio,
                subtotal
            });
            productosProcesados.push({ productoRef, stockActual, cantidad });
            total += subtotal;
            if (!Number.isFinite(total)) throw new Error("TOTAL_INVALIDO");
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
        const pedidoRef = database.collection("pedidos").doc();

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
            idempotencyId: clave.id,
            idempotencyPayloadHash: clave.payloadHash,
            historialEstados: [{ estado: "pendiente", fecha: ahora, actorUid: clienteUid, actorRol: "Cliente" }],
            pagado: false,
            metodoPago: esEnLinea ? "En línea (simulado; por cobrar al retirar)" : "Pendiente",
            fechaPedido: ahora,
            fechaActualizacion: ahora,
            ...(limiteRetiro ? { fechaLimite: limiteRetiro } : {})
        };

        transaction.set(pedidoRef, pedido);
        transaction.create(claveRef, {
            payloadHash: clave.payloadHash,
            resourceId: pedidoRef.id,
            resourceType: "pedido",
            createdAt: new Date(ahora),
            expiresAt: fechaExpiracionIdempotencia(new Date(ahora))
        });
        return { pedido: { id: pedidoRef.id, ...pedido }, repetido: false };
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
            await cambiarEstado(doc.id, "cancelado", null, "Vencido: no se retiró a tiempo", { actorRol: "Sistema" });
        } catch (error) {
            console.error(`Error al vencer pedido ${doc.id}:`, error.message);
        }
    }
};

// Cambiar estado del pedido controlando transiciones, inventario y registro de venta
export const cambiarEstadoConDb = async (id, nuevoEstado, metodoPagoEntrega, motivoCancelacion, database, actor = {}) => {
    return await database.runTransaction(async (transaction) => {
        const pedidoRef = database.collection("pedidos").doc(id);
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
                const prodRef = database.collection("productos").doc(item.productoId);
                const prodDoc = await transaction.get(prodRef);
                if (prodDoc.exists) {
                    const stockActual = Number(prodDoc.data().stock);
                    const cantidad = Number(item.cantidad);
                    if (!Number.isSafeInteger(stockActual) || stockActual < 0
                        || !Number.isSafeInteger(cantidad) || cantidad <= 0
                        || !Number.isSafeInteger(stockActual + cantidad)) {
                        throw new Error("STOCK_INVALIDO");
                    }
                    productosRestaurar.push({
                        ref: prodRef,
                        stockActual,
                        cantidad
                    });
                }
            }
        }

        const ahora = new Date().toISOString();
        const historialAnterior = Array.isArray(pedido.historialEstados)
            ? pedido.historialEstados
            : [{ estado: pedido.estado, fecha: pedido.fechaActualizacion || pedido.fechaPedido || null, actorRol: "Migracion" }];
        const historialEstados = [...historialAnterior, {
            estado: nuevoEstado,
            fecha: ahora,
            actorUid: actor.uid || null,
            actorRol: actor.role || actor.actorRol || "Sistema",
            ...(motivoCancelacion ? { motivo: motivoCancelacion } : {}),
        }];

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
                historialEstados,
                ...(motivoCancelacion ? { motivoCancelacion } : {})
            };
            transaction.update(pedidoRef, actualizacion);
            return { pedido: { id, ...pedido, ...actualizacion } };
        }

        if (nuevoEstado === "entregado") {
            const metodoFinal = pedido.pagado
                ? pedido.metodoPago
                : (metodoPagoEntrega || "Efectivo");

            const ventaRef = database.collection("ventas").doc();
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
                fechaActualizacion: ahora,
                historialEstados
            };

            transaction.update(pedidoRef, actualizacion);
            return {
                pedido: { id, ...pedido, ...actualizacion },
                venta: { id: ventaRef.id, ...venta }
            };
        }

        const actualizacion = {
            estado: "listo",
            fechaActualizacion: ahora,
            historialEstados
        };
        transaction.update(pedidoRef, actualizacion);
        return { pedido: { id, ...pedido, ...actualizacion } };
    });
};

export const cambiarEstado = (id, nuevoEstado, metodoPagoEntrega, motivoCancelacion, actor) =>
    cambiarEstadoConDb(id, nuevoEstado, metodoPagoEntrega, motivoCancelacion, db, actor);

// Extender el plazo de retiro de un pedido pendiente o listo sin pagar
export const extenderPlazo = async (id) => {
    return await db.runTransaction(async (transaction) => {
        const pedidoRef = db.collection("pedidos").doc(id);
        const pedidoDoc = await transaction.get(pedidoRef);

        if (!pedidoDoc.exists) {
            throw new Error("PEDIDO_NO_ENCONTRADO");
        }

        const pedido = pedidoDoc.data();
        const esValido = pedido.tipo === "retiro"
            && !pedido.pagado
            && (pedido.estado === "pendiente" || pedido.estado === "listo");

        if (!esValido) {
            throw new Error("NO_EXTENDIBLE");
        }

        const extensionesActuales = Number(pedido.extensiones || 0);
        if (extensionesActuales >= 3) {
            throw new Error("LIMITE_EXTENSIONES");
        }

        const baseMs = pedido.fechaLimite
            ? new Date(pedido.fechaLimite).getTime()
            : new Date(pedido.fechaPedido).getTime() + DIAS_PARA_RETIRAR * 24 * 60 * 60 * 1000;

        const baseMayorMs = Math.max(baseMs, Date.now());
        const dosDiasMs = 2 * 24 * 60 * 60 * 1000;
        const nuevaFechaLimite = new Date(baseMayorMs + dosDiasMs).toISOString();
        const ahora = new Date().toISOString();

        const actualizacion = {
            fechaLimite: nuevaFechaLimite,
            extensiones: extensionesActuales + 1,
            fechaActualizacion: ahora
        };

        transaction.update(pedidoRef, actualizacion);

        return {
            id,
            ...pedido,
            ...actualizacion
        };
    });
};

