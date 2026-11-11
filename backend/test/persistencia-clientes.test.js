import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { crearGestorOperacionPendiente } from "../../frontend/src/utils/operacionPendiente.js";
import { crearGestorPedidoPendiente, huellaPedido } from "../../mobile/src/features/compras/services/operacion-pendiente.ts";
import { crearGestorCarritoPersistente } from "../../mobile/src/features/compras/services/carrito-persistente.ts";

class WebStorage {
    values = new Map();
    getItem(key) { return this.values.get(key) ?? null; }
    setItem(key, value) { this.values.set(key, value); }
    removeItem(key) { this.values.delete(key); }
}
class MobileStorage {
    values = new Map();
    async getItem(key) { return this.values.get(key) ?? null; }
    async setItem(key, value) { this.values.set(key, value); }
    async removeItem(key) { this.values.delete(key); }
}

test("Web recupera la misma clave tras recrear el gestor (recarga) y la elimina tras confirmar", async () => {
    const storage = new WebStorage();
    const config = { storage, hash: async (payload) => `hash:${JSON.stringify(payload)}`, crearKey: () => "web-pedido-test-key" };
    const first = crearGestorOperacionPendiente(config);
    const payload = { productos: [{ productoId: "p1", cantidad: 1 }], tipo: "retiro" };
    const key = await first.obtener({ uid: "u1", scope: "pedido", payload });
    const record = JSON.parse(storage.getItem("vetcare:idempotency:v1:u1:pedido"));
    assert.equal(Object.keys(record).sort().join(","), "createdAt,fingerprint,key");
    assert.equal(await crearGestorOperacionPendiente(config).obtener({ uid: "u1", scope: "pedido", payload }), key);
    await first.confirmar({ uid: "u1", scope: "pedido", key });
    assert.equal(storage.getItem("vetcare:idempotency:v1:u1:pedido"), null);
});

test("Web no comparte una operación en curso si el payload cambia", async () => {
    const storage = new WebStorage();
    const gestor = crearGestorOperacionPendiente({ storage, hash: async (payload) => `hash:${JSON.stringify(payload)}`, crearKey: () => "web-pedido-test-key" });
    const results = await Promise.allSettled([
        gestor.obtener({ uid: "u1", scope: "pedido", payload: { tipo: "retiro" } }),
        gestor.obtener({ uid: "u1", scope: "pedido", payload: { tipo: "en_linea" } }),
    ]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(results.filter((result) => result.status === "rejected").length, 1);
});

test("Mobile AsyncStorage fake conserva clave al reiniciar gestor, separa usuarios y rechaza payload distinto", async () => {
    const storage = new MobileStorage();
    const first = crearGestorPedidoPendiente(storage);
    const payload = { productos: [{ productoId: "p1", cantidad: 1 }], tipo: "retiro" };
    const key = await first.obtener("u1", payload);
    const restarted = crearGestorPedidoPendiente(storage);
    assert.equal(await restarted.obtener("u1", payload), key);
    assert.notEqual(await restarted.obtener("u2", payload), key);
    await assert.rejects(() => restarted.obtener("u1", { ...payload, tipo: "en_linea" }), /operación pendiente con otros datos/);
    const jsonCanonico = JSON.stringify({ productos: [{ cantidad: 1, productoId: "p1" }], tipo: "retiro" });
    assert.equal(huellaPedido(payload), createHash("sha256").update(jsonCanonico).digest("hex"));
});

test("Mobile no comparte una operación en curso si el payload cambia", async () => {
    const gestor = crearGestorPedidoPendiente(new MobileStorage());
    const results = await Promise.allSettled([
        gestor.obtener("u1", { tipo: "retiro" }),
        gestor.obtener("u1", { tipo: "en_linea" }),
    ]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(results.filter((result) => result.status === "rejected").length, 1);
});

test("el carrito y tipo de pedido se recuperan tras reiniciar el gestor y se aíslan por UID", async () => {
    const storage = new MobileStorage();
    const first = crearGestorCarritoPersistente(storage);
    const cart = { "p-1": { producto: { id: "p-1", nombre: "Alimento", precio: 8, stock: 4 }, cantidad: 2 } };
    await first.guardar("uid-a", cart, "en_linea");

    const restarted = crearGestorCarritoPersistente(storage);
    assert.deepEqual(await restarted.cargar("uid-a"), { carrito: cart, tipoPedido: "en_linea" });
    assert.equal(await restarted.cargar("uid-b"), null);
    await restarted.guardar("uid-b", { "p-2": { producto: { id: "p-2", nombre: "Premio", precio: 3, stock: 6 }, cantidad: 1 } }, "retiro");
    assert.equal((await restarted.cargar("uid-a")).tipoPedido, "en_linea");
    assert.equal((await restarted.cargar("uid-b")).tipoPedido, "retiro");
});

test("cambio de cuenta carga su propio carrito y no restaura el UID anterior", async () => {
    const storage = new MobileStorage();
    const cartStore = crearGestorCarritoPersistente(storage);
    const carritoA = { "p-a": { producto: { id: "p-a", nombre: "A", precio: 1, stock: 5 }, cantidad: 1 } };
    const carritoB = { "p-b": { producto: { id: "p-b", nombre: "B", precio: 2, stock: 5 }, cantidad: 3 } };
    await cartStore.guardar("uid-a", carritoA, "retiro");
    await cartStore.guardar("uid-b", carritoB, "en_linea");
    assert.deepEqual(Object.keys((await cartStore.cargar("uid-b")).carrito), ["p-b"]);
});

test("compra pendiente conserva clave y snapshot; cambios de carrito no reutilizan la clave", async () => {
    const storage = new MobileStorage();
    const cartStore = crearGestorCarritoPersistente(storage);
    const operationStore = crearGestorPedidoPendiente(storage);
    const cart = { "p-1": { producto: { id: "p-1", nombre: "Alimento", precio: 8, stock: 4 }, cantidad: 2 } };
    const payload = { productos: [{ productoId: "p-1", cantidad: 2 }], tipo: "retiro" };
    await cartStore.guardar("uid-a", cart, "retiro");
    const key = await operationStore.obtener("uid-a", payload);

    const restartedCartStore = crearGestorCarritoPersistente(storage);
    const restartedOperationStore = crearGestorPedidoPendiente(storage);
    assert.deepEqual(await restartedCartStore.cargar("uid-a"), { carrito: cart, tipoPedido: "retiro" });
    assert.equal(await restartedOperationStore.hayPendiente("uid-a"), true);
    assert.equal(await restartedOperationStore.obtener("uid-a", payload), key);
    const changedPayload = { productos: [{ productoId: "p-1", cantidad: 1 }], tipo: "retiro" };
    await assert.rejects(() => restartedOperationStore.obtener("uid-a", changedPayload), /operación pendiente con otros datos/);
    assert.equal(await restartedOperationStore.obtener("uid-a", payload), key);
    assert.notEqual(await restartedOperationStore.obtener("uid-b", payload), key);
});
