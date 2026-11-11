import test from "node:test";
import assert from "node:assert/strict";
import { cambiarEstadoConDb, crearPedidoConDb } from "../src/services/pedidos.service.js";
import { crearVentaConDb } from "../src/services/ventas.service.js";
import { crearControladorRegistrarVenta } from "../src/controllers/ventas.controller.js";
import {
    crearControladorCancelarMiPedido,
    crearControladorObtenerCatalogo,
    crearControladorObtenerProductoTienda,
    crearControladorObtenerMisPedidos,
} from "../src/controllers/tienda.controller.js";
import { validarPedido } from "../src/validators/pedido.validator.js";
import { validarProducto } from "../src/validators/producto.validator.js";
import { eliminarConDb } from "../src/services/productos.service.js";
import { resolverFacturaVenta } from "../src/utils/factura-idempotente.js";
import { fechaExpiracionIdempotencia } from "../src/utils/idempotency.js";

class FakeFirestore {
    constructor() { this.collections = new Map(); this.sequence = 0; this.tail = Promise.resolve(); }
    collection(name) {
        return {
            doc: (id) => ({ collection: name, id: id || `auto-${++this.sequence}` }),
            where: (field, operator, value) => ({ collection: name, field, operator, value, limit: () => ({ collection: name, field, operator, value, isQuery: true }) }),
        };
    }
    async runTransaction(callback) {
        let release;
        const previous = this.tail;
        this.tail = new Promise((resolve) => { release = resolve; });
        await previous;
        const writes = [];
        const transaction = {
            get: async (ref) => {
                if (ref.isQuery) {
                    const entries = [...(this.collections.get(ref.collection) || new Map())].filter(([, data]) => data[ref.field] === ref.value).slice(0, 1);
                    const docs = entries.map(([id, data]) => ({ id, data: () => structuredClone(data) }));
                    return { empty: docs.length === 0, docs };
                }
                const data = this.collections.get(ref.collection)?.get(ref.id);
                return { id: ref.id, exists: data !== undefined, data: () => structuredClone(data) };
            },
            update: (ref, value) => writes.push(["update", ref, value]),
            set: (ref, value) => writes.push(["set", ref, value]),
            create: (ref, value) => writes.push(["create", ref, value]),
        };
        try {
            const result = await callback(transaction);
            for (const [type, ref, value] of writes) {
                const collection = this.collections.get(ref.collection) || new Map();
                this.collections.set(ref.collection, collection);
                if (type === "create" && collection.has(ref.id)) throw new Error("already exists");
                collection.set(ref.id, { ...(type === "update" ? collection.get(ref.id) : {}), ...structuredClone(value) });
            }
            return result;
        } finally { release(); }
    }
    seed(collection, id, data) {
        if (!this.collections.has(collection)) this.collections.set(collection, new Map());
        this.collections.get(collection).set(id, structuredClone(data));
    }
    value(collection, id) { return this.collections.get(collection)?.get(id); }
}

const key = (kind) => `web-${kind}-${Date.now().toString(36)}-testabc123`;
const producto = [{ productoId: "food-1", cantidad: 2 }];

test("compra: reintento y dos solicitudes simultáneas descuentan inventario una sola vez", async () => {
    const db = new FakeFirestore();
    db.seed("productos", "food-1", { nombre: "Alimento", precio: 5, stock: 10, activo: true });
    const datos = { clienteUid: "user-a", clienteNombre: "A", clienteEmail: "a@example.test", productos: producto, tipo: "retiro", idempotencyKey: key("pedido") };
    const [primero, concurrente] = await Promise.all([crearPedidoConDb(datos, db), crearPedidoConDb(datos, db)]);
    const reintento = await crearPedidoConDb(datos, db);
    assert.equal(primero.pedido.id, concurrente.pedido.id);
    assert.equal(primero.pedido.id, reintento.pedido.id);
    assert.equal(db.value("productos", "food-1").stock, 8);
});

test("pedido recupera el mismo recurso después de borrar el documento auxiliar", async () => {
    const db = new FakeFirestore();
    db.seed("productos", "food-1", { nombre: "Alimento", precio: 5, stock: 10, activo: true });
    const datos = { clienteUid: "user-a", productos: producto, tipo: "retiro", idempotencyKey: key("pedido") };
    const primera = await crearPedidoConDb(datos, db);
    db.collections.delete("idempotencia");
    const recuperada = await crearPedidoConDb(datos, db);
    assert.equal(recuperada.repetido, true);
    assert.equal(recuperada.pedido.id, primera.pedido.id);
    assert.equal(db.value("productos", "food-1").stock, 8);
});

test("venta: reintento devuelve la venta original y no vuelve a bajar inventario", async () => {
    const db = new FakeFirestore();
    db.seed("productos", "food-1", { nombre: "Alimento", precio: 5, stock: 10 });
    const datos = { actorUid: "staff-a", productos: producto, cliente: "A", metodoPago: "Efectivo", correoCliente: "a@example.test", idempotencyKey: key("venta") };
    const primera = await crearVentaConDb(datos, db);
    db.collections.delete("idempotencia"); // simula que TTL limpió el documento auxiliar
    const repetida = await crearVentaConDb(datos, db);
    assert.equal(repetida.repetido, true);
    assert.equal(repetida.venta.id, primera.venta.id);
    assert.equal(db.value("productos", "food-1").stock, 8);
});

test("dos solicitudes simultáneas de una venta crean una venta y un solo descuento", async () => {
    const db = new FakeFirestore();
    db.seed("productos", "food-1", { nombre: "Alimento", precio: 5, stock: 10 });
    const datos = { actorUid: "staff-a", productos: producto, idempotencyKey: key("venta") };
    const [primera, concurrente] = await Promise.all([crearVentaConDb(datos, db), crearVentaConDb(datos, db)]);
    assert.equal(primera.venta.id, concurrente.venta.id);
    assert.equal(db.value("productos", "food-1").stock, 8);
    assert.equal(db.collections.get("ventas").size, 1);
});

test("reutilizar una clave con otros datos se rechaza y usuarios quedan aislados", async () => {
    const db = new FakeFirestore();
    db.seed("productos", "food-1", { nombre: "Alimento", precio: 5, stock: 10, activo: true });
    const sharedKey = key("pedido");
    const base = { clienteUid: "user-a", productos: producto, tipo: "retiro", idempotencyKey: sharedKey };
    const original = await crearPedidoConDb(base, db);
    db.collections.delete("idempotencia");
    await assert.rejects(() => crearPedidoConDb({ ...base, productos: [{ productoId: "food-1", cantidad: 3 }] }, db), /IDEMPOTENCY_KEY_REUSED/);
    const otherUser = await crearPedidoConDb({ ...base, clienteUid: "user-b" }, db);
    assert.notEqual(otherUser.pedido.id, original.pedido.id);
    assert.equal(db.value("productos", "food-1").stock, 6);
});

test("la venta rechaza cantidades cambiadas con la misma clave", async () => {
    const db = new FakeFirestore();
    db.seed("productos", "food-1", { nombre: "Alimento", precio: 5, stock: 10 });
    const idempotencyKey = key("venta");
    const base = { actorUid: "staff-a", productos: producto, idempotencyKey };
    await crearVentaConDb(base, db);
    await assert.rejects(() => crearVentaConDb({ ...base, productos: [{ productoId: "food-1", cantidad: 1 }] }, db), /IDEMPOTENCY_KEY_REUSED/);
    assert.equal(db.value("productos", "food-1").stock, 8);
});

test("el servicio ignora precio y total manipulados y calcula desde inventario", async () => {
    const db = new FakeFirestore();
    db.seed("productos", "food-1", { nombre: "Alimento", precio: 5, stock: 10 });
    const venta = await crearVentaConDb({
        actorUid: "staff-a",
        productos: [{ productoId: "food-1", cantidad: 2, precio: 0.01, precioUnitario: 0.01, subtotal: 0.02 }],
        total: 0.02,
        idempotencyKey: key("venta")
    }, db);
    assert.equal(venta.venta.productos[0].precioUnitario, 5);
    assert.equal(venta.venta.productos[0].subtotal, 10);
    assert.equal(venta.venta.total, 10);
});

test("los servicios rechazan cantidades inválidas sin tocar inventario", async () => {
    const db = new FakeFirestore();
    db.seed("productos", "food-1", { nombre: "Alimento", precio: 5, stock: 10, activo: true });
    await assert.rejects(() => crearVentaConDb({ actorUid: "staff-a", productos: [{ productoId: "food-1", cantidad: 1.5 }], idempotencyKey: key("venta") }, db), /PRODUCTO_INVALIDO/);
    await assert.rejects(() => crearPedidoConDb({ clienteUid: "user-a", productos: [{ productoId: "food-1", cantidad: 0 }], tipo: "retiro", idempotencyKey: key("pedido") }, db), /PRODUCTO_INVALIDO/);
    assert.equal(db.value("productos", "food-1").stock, 10);
});

test("un reintento de venta no reenvía la factura", async () => {
    let envios = 0;
    const enviarFactura = async () => { envios += 1; return { enviado: true }; };
    const ventaPrimera = { id: "sale-1", facturaEstado: "pendiente" };
    await resolverFacturaVenta({ resultadoVenta: { venta: ventaPrimera, repetido: false }, correoDestino: "a@example.test", enviarFactura });
    const respuestaRepetida = await resolverFacturaVenta({ resultadoVenta: { venta: { ...ventaPrimera, facturaEstado: "enviada" }, repetido: true }, correoDestino: "a@example.test", enviarFactura });
    assert.equal(envios, 1);
    assert.equal(respuestaRepetida.enviado, true);
});

test("el catalogo solo devuelve productos activos con stock y precios del servidor", async () => {
    const controlador = crearControladorObtenerCatalogo(async () => [
        { id: "p1", nombre: "Alimento", categoria: "Comida", precio: "12.50", stock: "3", activo: true, descripcion: "Adulto", imagenUrl: "https://images.example.test/alimento.jpg" },
        { id: "p2", nombre: "Agotado", categoria: "Comida", precio: 5, stock: 0, activo: true },
        { id: "p3", nombre: "Inactivo", categoria: "Juguetes", precio: 2, stock: 4, activo: false },
    ]);
    let status;
    let body;
    const res = {
        status(code) { status = code; return this; },
        json(value) { body = value; return this; },
    };
    await controlador({}, res);
    assert.equal(status, 200);
    assert.deepEqual(body.data, [{
        id: "p1", nombre: "Alimento", categoria: "Comida", precio: 12.5, stock: 3, descripcion: "Adulto", imagenUrl: "https://images.example.test/alimento.jpg",
    }]);
});

test("los productos aceptan imagen HTTPS opcional y rechazan URLs inseguras", () => {
    const base = { nombre: "Alimento", categoria: "Comida", precio: 5, stock: 3, stockMinimo: 1 };
    assert.equal(validarProducto({ ...base, imagenUrl: "https://images.example.test/p1.jpg" }), null);
    assert.equal(validarProducto({ ...base, imagenUrl: "http://images.example.test/p1.jpg" }), "La URL de imagen debe usar HTTPS.");
    assert.equal(validarProducto({ ...base, activo: false }), null);
    assert.match(validarProducto({ ...base, activo: "false" }), /valor booleano/);
});

test("los pedidos rechazan stock insuficiente y cantidad invalida y calculan precios del producto", async () => {
    assert.match(validarPedido({ productos: [{ productoId: "p1", cantidad: 0 }], tipo: "retiro" }), /entero mayor/);
    assert.match(validarPedido({ productos: [{ productoId: "p1", cantidad: 15 }, { productoId: "p1", cantidad: 6 }], tipo: "retiro" }), /mÃ¡xima por producto/);
    const db = new FakeFirestore();
    db.seed("productos", "p1", { nombre: "Alimento", precio: 7.25, stock: 2, activo: true });
    const datos = { clienteUid: "user-a", productos: [{ productoId: "p1", cantidad: 3 }], tipo: "retiro", idempotencyKey: key("stock") };
    await assert.rejects(() => crearPedidoConDb({
        ...datos,
        productos: [{ productoId: "p1", cantidad: 15 }, { productoId: "p1", cantidad: 6 }],
        idempotencyKey: key("limite"),
    }, db), /PRODUCTO_INVALIDO/);
    await assert.rejects(() => crearPedidoConDb(datos, db), /STOCK_INSUFICIENTE/);
    assert.equal(db.value("productos", "p1").stock, 2);

    const pedido = await crearPedidoConDb({
        ...datos,
        productos: [{ productoId: "p1", cantidad: 2, precio: 0.01, subtotal: 0.02 }],
        total: 0.02,
        idempotencyKey: key("precio"),
    }, db);
    assert.equal(pedido.pedido.productos[0].precioUnitario, 7.25);
    assert.equal(pedido.pedido.productos[0].subtotal, 14.5);
    assert.equal(pedido.pedido.total, 14.5);
});

test("cancelar un pedido restaura inventario una sola vez y valida transiciones", async () => {
    const db = new FakeFirestore();
    db.seed("productos", "p1", { nombre: "Alimento", precio: 7, stock: 3, activo: true });
    const pedidoCreado = await crearPedidoConDb({
        clienteUid: "user-a", productos: [{ productoId: "p1", cantidad: 2 }], tipo: "retiro", idempotencyKey: key("cancelar"),
    }, db);
    assert.equal(db.value("productos", "p1").stock, 1);

    const cancelado = await cambiarEstadoConDb(pedidoCreado.pedido.id, "cancelado", null, "Cancelado en prueba", db, { uid: "staff-1", role: "Recepcionista" });
    assert.equal(cancelado.pedido.estado, "cancelado");
    assert.equal(cancelado.pedido.motivoCancelacion, "Cancelado en prueba");
    assert.equal(cancelado.pedido.historialEstados.length, 2);
    assert.deepEqual(cancelado.pedido.historialEstados[1], {
        estado: "cancelado",
        fecha: cancelado.pedido.fechaActualizacion,
        actorUid: "staff-1",
        actorRol: "Recepcionista",
        motivo: "Cancelado en prueba",
    });
    assert.equal(db.value("productos", "p1").stock, 3);
    await assert.rejects(() => cambiarEstadoConDb(pedidoCreado.pedido.id, "cancelado", null, null, db), /TRANSICION_INVALIDA/);
    assert.equal(db.value("productos", "p1").stock, 3);
});

test("entregar un pedido registra una sola venta y rechaza transiciones repetidas", async () => {
    const db = new FakeFirestore();
    db.seed("productos", "p1", { nombre: "Alimento", precio: 7, stock: 5, activo: true });
    const creado = await crearPedidoConDb({
        clienteUid: "user-a", productos: [{ productoId: "p1", cantidad: 1 }], tipo: "retiro", idempotencyKey: key("entrega"),
    }, db);
    await cambiarEstadoConDb(creado.pedido.id, "listo", null, null, db);
    const entregado = await cambiarEstadoConDb(creado.pedido.id, "entregado", "Efectivo", null, db);
    assert.equal(entregado.pedido.estado, "entregado");
    assert.deepEqual(entregado.pedido.historialEstados.map((cambio) => cambio.estado), ["pendiente", "listo", "entregado"]);
    assert.equal(db.collections.get("ventas").size, 1);
    await assert.rejects(() => cambiarEstadoConDb(creado.pedido.id, "entregado", "Efectivo", null, db), /TRANSICION_INVALIDA/);
    assert.equal(db.collections.get("ventas").size, 1);
    assert.equal(db.value("productos", "p1").stock, 4);
});

test("retirar un producto conserva el documento para cancelar pedidos y reponer stock", async () => {
    const db = new FakeFirestore();
    db.seed("productos", "p1", { nombre: "Alimento", precio: 7, stock: 5, activo: true });
    const creado = await crearPedidoConDb({
        clienteUid: "user-a", productos: [{ productoId: "p1", cantidad: 2 }], tipo: "retiro", idempotencyKey: key("retirado"),
    }, db);
    assert.equal(db.value("productos", "p1").stock, 3);
    assert.equal(await eliminarConDb("p1", db), true);
    assert.equal(db.value("productos", "p1").activo, false);

    await cambiarEstadoConDb(creado.pedido.id, "cancelado", null, "Cancelado", db);
    assert.equal(db.value("productos", "p1").stock, 5);
    assert.equal(db.value("productos", "p1").activo, false);
    assert.ok(db.value("productos", "p1"));
});

test("el historial consulta exclusivamente pedidos del UID autenticado", async () => {
    let uidConsultado;
    let body;
    const controlador = crearControladorObtenerMisPedidos({
        listar: async (uid) => { uidConsultado = uid; return [{ id: "order-b", clienteUid: uid }]; },
        vencer: async () => {},
    });
    const res = {
        status(code) { assert.equal(code, 200); return this; },
        json(value) { body = value; return this; },
    };
    await controlador({ user: { uid: "user-b" } }, res);
    assert.equal(uidConsultado, "user-b");
    assert.deepEqual(body.data, [{ id: "order-b", clienteUid: "user-b" }]);
});

test("un cliente no puede cancelar el pedido de otro UID", async () => {
    let actualizaciones = 0;
    let status;
    const controlador = crearControladorCancelarMiPedido({
        buscar: async () => ({ id: "order-a", clienteUid: "user-a", estado: "pendiente" }),
        actualizar: async () => { actualizaciones += 1; },
    });
    const res = {
        status(code) { status = code; return this; },
        json() { return this; },
    };
    await controlador({ params: { id: "order-a" }, user: { uid: "user-b" } }, res);
    assert.equal(status, 404);
    assert.equal(actualizaciones, 0);
});

test("el controlador de ventas omite el correo y el estado lateral al recuperar una venta", async () => {
    let envios = 0;
    let actualizaciones = 0;
    const controlador = crearControladorRegistrarVenta({
        crearVenta: async () => ({ venta: { id: "sale-1", facturaEstado: "enviada" }, repetido: true }),
        enviarFactura: async () => { envios += 1; return { enviado: true }; },
        actualizarEstadoFactura: async () => { actualizaciones += 1; },
    });
    let status;
    let body;
    const res = {
        set() { return this; },
        status(code) { status = code; return this; },
        json(value) { body = value; return this; },
    };
    await controlador({ user: { uid: "staff-a" }, idempotencyKey: key("venta"), body: { productos: producto } }, res);
    assert.equal(status, 200);
    assert.equal(body.data.id, "sale-1");
    assert.equal(envios, 0);
    assert.equal(actualizaciones, 0);
});

test("los registros tienen 90 días de retención", () => {
    const inicio = new Date("2026-01-01T00:00:00.000Z");
    assert.equal(fechaExpiracionIdempotencia(inicio).toISOString(), "2026-04-01T00:00:00.000Z");
});

test("el detalle público permite consultar productos agotados activos y filtra imágenes inseguras", async () => {
    const controlador = crearControladorObtenerProductoTienda(async () => ({
        id: "food-1", nombre: "Alimento", categoria: "Comida", descripcion: "Descripción",
        precio: 4.5, stock: 0, activo: true, imagenUrl: "http://insegura.test/foto.png",
    }));
    let status;
    let body;
    const res = {
        status(code) { status = code; return this; },
        json(value) { body = value; return this; },
    };
    await controlador({ params: { id: "food-1" } }, res);
    assert.equal(status, 200);
    assert.equal(body.data.stock, 0);
    assert.equal(body.data.precio, 4.5);
    assert.equal("imagenUrl" in body.data, false);
});

test("el detalle público no expone productos inactivos", async () => {
    const controlador = crearControladorObtenerProductoTienda(async () => ({ id: "hidden", activo: false }));
    let status;
    const res = {
        status(code) { status = code; return this; },
        json() { return this; },
    };
    await controlador({ params: { id: "hidden" } }, res);
    assert.equal(status, 404);
});
