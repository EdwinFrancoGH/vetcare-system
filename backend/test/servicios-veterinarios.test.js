import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { crearControladorServiciosVeterinarios } from "../src/controllers/servicios-veterinarios.controller.js";
import { crearVerifyRoles } from "../src/middlewares/auth.middleware.js";
import { crearRouterServiciosVeterinarios } from "../src/routes/servicios-veterinarios.routes.js";
import { crearServicioServiciosVeterinarios } from "../src/services/servicios-veterinarios.service.js";
import {
    normalizarDatosServicioVeterinario,
    validarServicioVeterinario,
} from "../src/validators/servicio-veterinario.validator.js";

class FakeFirestore {
    constructor() { this.collections = new Map(); this.sequence = 0; this.tail = Promise.resolve(); }
    collection(name) {
        return {
            doc: (id) => ({ collection: name, id: id || `auto-${++this.sequence}` }),
            get: async () => ({ docs: [...(this.collections.get(name) || new Map())].map(([id, data]) => ({ id, data: () => structuredClone(data) })) }),
        };
    }
    async runTransaction(callback) {
        let release;
        const previous = this.tail;
        this.tail = new Promise((resolve) => { release = resolve; });
        await previous;
        const writes = [];
        let writing = false;
        const transaction = {
            get: async (ref) => {
                if (writing) throw new Error("Transaction read after write");
                const data = this.collections.get(ref.collection)?.get(ref.id);
                return { id: ref.id, exists: data !== undefined, data: () => structuredClone(data) };
            },
            create: (ref, value) => { writing = true; writes.push(["create", ref, value]); },
            update: (ref, value) => { writing = true; writes.push(["update", ref, value]); },
            delete: (ref) => { writing = true; writes.push(["delete", ref]); },
        };
        try {
            const result = await callback(transaction);
            for (const [operation, ref, value] of writes) {
                const collection = this.collections.get(ref.collection) || new Map();
                this.collections.set(ref.collection, collection);
                if (operation === "create") {
                    if (collection.has(ref.id)) throw new Error("ALREADY_EXISTS");
                    collection.set(ref.id, structuredClone(value));
                } else if (operation === "update") {
                    if (!collection.has(ref.id)) throw new Error("NOT_FOUND");
                    collection.set(ref.id, { ...collection.get(ref.id), ...structuredClone(value) });
                } else collection.delete(ref.id);
            }
            return result;
        } finally { release(); }
    }
    seed(collection, id, value) {
        const docs = this.collections.get(collection) || new Map();
        docs.set(id, structuredClone(value));
        this.collections.set(collection, docs);
    }
    value(collection, id) { return this.collections.get(collection)?.get(id); }
}

const payload = (overrides = {}) => ({ nombre: "Consulta general", descripcion: "Evaluación veterinaria", precioCentavos: 3250, moneda: "USD", ...overrides });
const crearServicio = () => {
    const db = new FakeFirestore();
    return { db, service: crearServicioServiciosVeterinarios(db) };
};

test("valida nombre y acepta solo precio entero positivo en centavos", () => {
    assert.equal(validarServicioVeterinario(payload()), null);
    assert.match(validarServicioVeterinario(payload({ nombre: "   " })), /nombre/i);
    for (const precioCentavos of [-1, 0, 1.5, "125", Number.NaN]) {
        assert.match(validarServicioVeterinario(payload({ precioCentavos })), /entero positivo/i);
    }
    assert.match(validarServicioVeterinario(payload({ activo: false })), /no est\u00e1 permitido/i);
    assert.match(validarServicioVeterinario(payload({ moneda: "GTQ" })), /USD/i);
});

test("crea un servicio con USD, activo y UID de auditoría; rechaza nombres duplicados normalizados", async () => {
    const { db, service } = crearServicio();
    const created = await service.crear(normalizarDatosServicioVeterinario({ nombre: "  Consulta   General ", descripcion: "Consulta", precioCentavos: 3250 }), "admin-1");
    assert.equal(created.nombre, "Consulta General");
    assert.equal(created.precioCentavos, 3250);
    assert.equal(created.moneda, "USD");
    assert.equal(created.activo, true);
    assert.equal(created.createdByUid, "admin-1");
    await assert.rejects(service.crear(normalizarDatosServicioVeterinario({ ...payload(), nombre: "consulta general" }), "admin-2"), { codigo: "NOMBRE_DUPLICADO" });
    assert.equal(db.collections.get("serviciosVeterinarios").size, 1);
});

test("dos altas concurrentes con el mismo nombre no pueden crear duplicados", async () => {
    const { db, service } = crearServicio();
    const results = await Promise.allSettled([
        service.crear(payload(), "admin-1"),
        service.crear(payload({ nombre: " consulta   general " }), "admin-2"),
    ]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(results.filter((result) => result.status === "rejected").length, 1);
    assert.equal(db.collections.get("serviciosVeterinarios").size, 1);
});

test("lista solo activos para usuarios y activos e inactivos para Administrador", async () => {
    const { db, service } = crearServicio();
    db.seed("serviciosVeterinarios", "activo", { nombre: "Consulta", activo: true });
    db.seed("serviciosVeterinarios", "inactivo", { nombre: "Vacuna", activo: false });
    assert.deepEqual((await service.listar()).map(({ id }) => id), ["activo"]);
    assert.equal((await service.listar({ incluirInactivos: true })).length, 2);
});

test("edita tarifa, activa y desactiva sin borrado físico", async () => {
    const { db, service } = crearServicio();
    const created = await service.crear(payload(), "admin-1");
    const changed = await service.actualizar(created.id, { precioCentavos: 5000 }, "admin-2");
    assert.equal(changed.precioCentavos, 5000);
    assert.equal(db.value("serviciosVeterinarios", created.id).updatedByUid, "admin-2");
    await service.cambiarEstado(created.id, false, "admin-2");
    assert.equal(db.value("serviciosVeterinarios", created.id).activo, false);
    await service.cambiarEstado(created.id, true, "admin-2");
    assert.equal(db.value("serviciosVeterinarios", created.id).activo, true);
    assert.equal(db.collections.get("serviciosVeterinarios").has(created.id), true);
});

test("router reserva escrituras al Administrador y no expone eliminación física", async (t) => {
    const { service } = crearServicio();
    const roles = new Map([
        ["admin", "Administrador"], ["reception", "Recepcionista"],
        ["vet", "Veterinario"], ["client", "Cliente"],
    ]);
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => { req.user = { uid: req.headers["x-user"] }; req.userRole = roles.get(req.user.uid); next(); });
    app.use("/api/servicios-veterinarios", crearRouterServiciosVeterinarios(
        crearVerifyRoles(async (uid) => roles.get(uid)),
        crearControladorServiciosVeterinarios({
            listar: service.listar.bind(service), crear: service.crear.bind(service),
            actualizar: service.actualizar.bind(service), cambiarEstado: service.cambiarEstado.bind(service),
        }),
    ));
    const server = app.listen(0);
    t.after(() => server.close());
    const url = `http://127.0.0.1:${server.address().port}/api/servicios-veterinarios`;
    const request = (role, method, path = "", body) => fetch(`${url}${path}`, {
        method, headers: { "x-user": role, "content-type": "application/json" },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const createAdmin = await request("admin", "POST", "/", payload());
    assert.equal(createAdmin.status, 201);
    const id = (await createAdmin.json()).data.id;
    await request("admin", "PATCH", `/${id}/estado`, { activo: false });
    const clientList = await request("client", "GET", "/");
    const clientServices = (await clientList.json()).data;
    assert.deepEqual(clientServices, []);
    const adminList = await request("admin", "GET", "/");
    assert.equal((await adminList.json()).data[0].activo, false);
    await request("admin", "PATCH", `/${id}/estado`, { activo: true });
    const activeClientList = await request("client", "GET", "/");
    const activeClientService = (await activeClientList.json()).data[0];
    assert.equal(activeClientService.activo, true);
    assert.equal("createdByUid" in activeClientService, false);
    assert.equal(adminList.status, 200);
    for (const role of ["reception", "vet", "client"]) {
        assert.equal((await request(role, "POST", "/", payload({ nombre: `Servicio ${role}` }))).status, 403);
        assert.equal((await request(role, "PATCH", `/${id}`, { precioCentavos: 1234 })).status, 403);
        assert.equal((await request(role, "PATCH", `/${id}/estado`, { activo: false })).status, 403);
    }
    assert.equal((await request("admin", "DELETE", `/${id}`)).status, 404);
});
