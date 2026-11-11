import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { crearControladorPagosCitas } from "../src/controllers/pagos-citas.controller.js";
import { crearVerifyRoles } from "../src/middlewares/auth.middleware.js";
import { crearRouterCitas } from "../src/routes/citas.routes.js";
import { crearServicioCitas } from "../src/services/citas.service.js";
import { crearServicioPagosCitas, ErrorPagoCita } from "../src/services/pagos-citas.service.js";
import { crearControladorPagos } from "../src/controllers/pagos.controller.js";
import { crearRouterPagos } from "../src/routes/pagos.routes.js";
import { validarReportePagoCita } from "../src/validators/pago-cita.validator.js";

class FakeFirestore {
    constructor() { this.collections = new Map(); this.sequence = 0; this.tail = Promise.resolve(); }
    collection(name) { return new FakeCollection(this, name); }
    async runTransaction(callback) {
        let release;
        const previous = this.tail;
        this.tail = new Promise((resolve) => { release = resolve; });
        await previous;
        const writes = [];
        const transaction = {
            get: async (ref) => {
                if (writes.length) throw new Error("Transaction read after write");
                if (ref.isQuery) return ref.snapshot();
                const data = this.collections.get(ref.collectionName)?.get(ref.id);
                return { id: ref.id, exists: data !== undefined, data: () => structuredClone(data) };
            },
            create: (ref, value) => writes.push(["create", ref, value]),
            update: (ref, value) => writes.push(["update", ref, value]),
            set: (ref, value) => writes.push(["set", ref, value]),
            delete: (ref) => writes.push(["delete", ref]),
        };
        try {
            const result = await callback(transaction);
            for (const [operation, ref, value] of writes) {
                const docs = this.collections.get(ref.collectionName) || new Map();
                this.collections.set(ref.collectionName, docs);
                if (operation === "create" && docs.has(ref.id)) throw new Error("ALREADY_EXISTS");
                if (operation === "update" && !docs.has(ref.id)) throw new Error("NOT_FOUND");
                if (operation === "delete") docs.delete(ref.id);
                else if (operation === "update") docs.set(ref.id, { ...docs.get(ref.id), ...structuredClone(value) });
                else docs.set(ref.id, structuredClone(value));
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
    query(collectionName, filters) {
        const docs = [...(this.collections.get(collectionName) || new Map())]
            .filter(([, data]) => filters.every(({ field, operator, value }) => {
                if (operator === "==") return data[field] === value;
                if (operator === "in") return value.includes(data[field]);
                throw new Error(`Unsupported fake query operator: ${operator}`);
            }))
            .map(([id, data]) => ({ id, data: () => structuredClone(data) }));
        return { docs, empty: docs.length === 0 };
    }
}

class FakeCollection {
    constructor(database, name) { this.database = database; this.name = name; }
    doc(id) { return new FakeDocument(this.database, this.name, id || `auto-${++this.database.sequence}`); }
    where(field, operator, value) { return new FakeQuery(this.database, this.name, [{ field, operator, value }]); }
    async get() {
        const docs = [...(this.database.collections.get(this.name) || new Map())]
            .map(([id, value]) => ({ id, data: () => structuredClone(value) }));
        return { docs, empty: docs.length === 0 };
    }
}

class FakeQuery {
    constructor(database, collectionName, filters) {
        this.database = database;
        this.collectionName = collectionName;
        this.filters = filters;
        this.isQuery = true;
    }
    where(field, operator, value) {
        return new FakeQuery(this.database, this.collectionName, [...this.filters, { field, operator, value }]);
    }
    snapshot() { return this.database.query(this.collectionName, this.filters); }
    async get() { return this.snapshot(); }
}

class FakeDocument {
    constructor(database, collectionName, id) { this.database = database; this.collectionName = collectionName; this.id = id; }
    collection(name) { return new FakeCollection(this.database, `${this.collectionName}/${this.id}/${name}`); }
    async get() {
        const data = this.database.collections.get(this.collectionName)?.get(this.id);
        return { id: this.id, exists: data !== undefined, data: () => structuredClone(data) };
    }
}

const cita = (extras = {}) => ({
    mascotaId: "pet-1", clienteUid: "client-1", servicioId: "service-1",
    servicioNombre: "Consulta general", precioCentavos: 3250, moneda: "USD",
    estado: "completada", veterinario: "Dra. Rivera", fecha: "2099-01-06", hora: "08:00",
    ...extras,
});
const inicializar = (citaActual = cita()) => {
    const db = new FakeFirestore();
    db.seed("citas", "cita-1", citaActual);
    db.seed("mascotas", "pet-1", { propietarioUid: "client-1", archivada: false });
    return { db, pagos: crearServicioPagosCitas(db), citas: crearServicioCitas(db) };
};
const reportar = (pagos, extras = {}) => pagos.reportar({
    citaId: "cita-1", clienteUid: "client-1", metodoPago: "Transferencia", referencia: "REF-001", ...extras,
});
const pagoSeed = (estado = "reportado", extras = {}) => ({
    citaId: "cita-1", clienteUid: "client-1", servicioId: "service-1",
    servicioNombre: "Consulta general", montoCentavos: 3250, moneda: "USD",
    metodoPago: "Transferencia", referencia: "REF-001", estado,
    reportadoAt: "2026-01-02T10:00:00.000Z", numeroIntentos: 1,
    ...extras,
});

test("reporte copia servicio, precio y USD congelados de la cita y crea un evento", async () => {
    const { db, pagos } = inicializar();
    const resultado = await reportar(pagos);
    assert.equal(resultado.pago.id, "cita-1");
    assert.equal(resultado.pago.clienteUid, "client-1");
    assert.equal(resultado.pago.montoCentavos, 3250);
    assert.equal(resultado.pago.moneda, "USD");
    assert.equal(resultado.pago.estado, "reportado");
    assert.equal(resultado.pago.verificadoAt, null);
    assert.equal(resultado.pago.verificadorUid, null);
    assert.equal(resultado.pago.verificadorRol, null);
    assert.equal(resultado.pago.motivoRechazo, null);
    assert.equal(db.value("pagos", "cita-1").numeroIntentos, 1);
    assert.equal(db.collections.get("pagos/cita-1/eventos").size, 1);
});

test("no reporta citas ajenas, canceladas o históricas sin precio válido", async () => {
    const { pagos, db } = inicializar();
    await assert.rejects(reportar(pagos, { clienteUid: "client-2" }), { codigo: "CITA_NO_PROPIA" });
    db.seed("citas", "cita-1", cita({ estado: "cancelada" }));
    await assert.rejects(reportar(pagos), { codigo: "CITA_NO_COMPLETADA" });
    db.seed("citas", "cita-1", cita({ precioCentavos: undefined }));
    await assert.rejects(reportar(pagos), { codigo: "CITA_SIN_TARIFA" });
    assert.equal(db.collections.has("pagos"), false);
});

test("solo completada acepta reportes; otros estados no crean ni modifican pago o historial", async () => {
    const estadosNoPermitidos = ["reservada", "confirmada", "cancelada", "perdida", "desconocido", "", null, undefined];

    for (const estado of estadosNoPermitidos) {
        const { db, pagos } = inicializar(cita({ estado }));
        await assert.rejects(reportar(pagos), { codigo: "CITA_NO_COMPLETADA" }, `Debe rechazar estado ${String(estado)}`);
        assert.equal(db.value("pagos", "cita-1"), undefined, `No debe crear pago para estado ${String(estado)}`);
        assert.equal(db.collections.get("pagos/cita-1/eventos"), undefined, `No debe crear historial para estado ${String(estado)}`);

        const { db: dbExistente, pagos: pagosExistentes } = inicializar(cita({ estado }));
        const pagoPrevio = { citaId: "cita-1", estado: "rechazado", numeroIntentos: 3, motivoRechazo: "Verificar de nuevo" };
        const eventoPrevio = { tipo: "rechazo", estado: "rechazado", intento: 3 };
        dbExistente.seed("pagos", "cita-1", pagoPrevio);
        dbExistente.seed("pagos/cita-1/eventos", "evento-previo", eventoPrevio);

        await assert.rejects(reportar(pagosExistentes), { codigo: "CITA_NO_COMPLETADA" }, `Debe rechazar estado ${String(estado)} con pago existente`);
        assert.deepEqual(dbExistente.value("pagos", "cita-1"), pagoPrevio);
        assert.deepEqual(dbExistente.value("pagos/cita-1/eventos", "evento-previo"), eventoPrevio);
        assert.equal(dbExistente.collections.get("pagos/cita-1/eventos").size, 1);
    }
});

test("no confía en tarifas del catálogo actual y nunca acepta importe del cliente", async () => {
    const { db, pagos } = inicializar(cita({ precioCentavos: 4410, servicioNombre: "Nombre histórico" }));
    db.seed("serviciosVeterinarios", "service-1", { nombre: "Nuevo nombre", precioCentavos: 99999, moneda: "USD", activo: true });
    const resultado = await reportar(pagos);
    assert.equal(resultado.pago.montoCentavos, 4410);
    assert.equal(resultado.pago.servicioNombre, "Nombre histórico");
    assert.equal(validarReportePagoCita({ metodoPago: "Efectivo", montoCentavos: 1 }), "El campo 'montoCentavos' no está permitido.");
});

test("impide reportes activos concurrentes, pero permite un nuevo intento tras rechazo conservando eventos", async () => {
    const { db, pagos } = inicializar();
    const intentos = await Promise.allSettled([reportar(pagos), reportar(pagos)]);
    assert.equal(intentos.filter((item) => item.status === "fulfilled").length, 1);
    assert.equal(intentos.filter((item) => item.status === "rejected" && item.reason.codigo === "PAGO_YA_REPORTADO").length, 1);
    assert.equal(db.collections.get("pagos").size, 1);
    assert.equal(db.collections.get("pagos/cita-1/eventos").size, 1);

    const previo = db.value("pagos", "cita-1");
    db.seed("pagos", "cita-1", { ...previo, estado: "rechazado", verificadoAt: "antes", verificadorUid: "staff-1", motivoRechazo: "No coincide" });
    const retry = await reportar(pagos, { metodoPago: "Efectivo", referencia: "REF-002" });
    assert.equal(retry.pago.estado, "reportado");
    assert.equal(retry.pago.numeroIntentos, 2);
    assert.equal(retry.pago.verificadoAt, null);
    assert.equal(retry.pago.verificadorUid, null);
    assert.equal(retry.pago.motivoRechazo, null);
    assert.equal(db.collections.get("pagos/cita-1/eventos").size, 2);
});

test("un pago aprobado es inmutable y citas completas sí pueden tener reporte", async () => {
    const { db, pagos } = inicializar(cita({ estado: "completada" }));
    db.seed("pagos", "cita-1", { citaId: "cita-1", estado: "aprobado", montoCentavos: 3250, numeroIntentos: 1 });
    await assert.rejects(reportar(pagos), { codigo: "PAGO_YA_APROBADO" });
    assert.equal(db.value("pagos", "cita-1").estado, "aprobado");
});

test("consulta permite cliente propietario, Administrador y Recepcionista, pero no Veterinario ni cliente ajeno", async () => {
    const { pagos } = inicializar();
    await reportar(pagos);
    assert.equal((await pagos.consultar("cita-1", "client-1", "Cliente")).pago.estado, "reportado");
    assert.equal((await pagos.consultar("cita-1", "admin-1", "Administrador")).pago.estado, "reportado");
    assert.equal((await pagos.consultar("cita-1", "recep-1", "Recepcionista")).pago.estado, "reportado");
    assert.equal((await pagos.consultar("cita-1", "vet-1", "Veterinario")).error, "NO_AUTORIZADO");
    assert.equal((await pagos.consultar("cita-1", "client-2", "Cliente")).error, "NO_AUTORIZADO");
});

test("bloquea cancelación reportada, en revisión o aprobada y permite una cita rechazada", async () => {
    for (const estado of ["reportado", "en_revision", "aprobado"]) {
        const { db, citas } = inicializar(cita({ estado: "confirmada" }));
        db.seed("pagos", "cita-1", { citaId: "cita-1", estado });
        assert.equal((await citas.actualizarSiDisponible("cita-1", { estado: "cancelada" })).error, "PAGO_IMPIDE_CANCELACION");
        assert.equal(db.value("citas", "cita-1").estado, "confirmada");
    }
    const { db, citas } = inicializar(cita({ estado: "confirmada" }));
    db.seed("pagos", "cita-1", { citaId: "cita-1", estado: "rechazado" });
    assert.equal((await citas.actualizarSiDisponible("cita-1", { estado: "cancelada" })).estado, "cancelada");
});

test("reporte y cancelación concurrentes no dejan cita cancelada con pago reportado", async () => {
    const { db, pagos, citas } = inicializar(cita({ estado: "confirmada" }));
    const [reporte, cancelacion] = await Promise.all([
        reportar(pagos).then((value) => ({ ok: true, value }), (error) => ({ ok: false, error })),
        citas.actualizarSiDisponible("cita-1", { estado: "cancelada" }).then((value) => ({ ok: true, value }), (error) => ({ ok: false, error })),
    ]);
    const pago = db.value("pagos", "cita-1");
    const estadoCita = db.value("citas", "cita-1").estado;
    assert.equal(Boolean(pago?.estado === "reportado" && estadoCita === "cancelada"), false);
    assert.equal(Boolean(pago?.estado === "reportado" && estadoCita === "confirmada")
        || Boolean(!pago && estadoCita === "cancelada"), true);
    assert.equal(reporte.ok || cancelacion.ok, true);
});

test("valida métodos reales y el límite de referencia; el POST solo permite rol Cliente", async (t) => {
    assert.equal(validarReportePagoCita({ metodoPago: "Efectivo" }), null);
    assert.equal(validarReportePagoCita({ metodoPago: "Tarjeta", referencia: "R" }), null);
    assert.equal(validarReportePagoCita({ metodoPago: "Transferencia" }), null);
    assert.match(validarReportePagoCita({ metodoPago: "Bitcoin" }), /método de pago/i);
    assert.match(validarReportePagoCita({ metodoPago: "Efectivo", referencia: "x".repeat(201) }), /200 caracteres/);

    const roles = new Map([["client", "Cliente"], ["admin", "Administrador"], ["vet", "Veterinario"]]);
    const handlers = new Proxy({}, { get: (_target, key) => (req, res) => res.status(200).json({ handler: key, role: req.userRole }) });
    const app = express();
    app.use((req, _res, next) => { req.user = { uid: req.headers["x-user"] }; next(); });
    app.use("/citas", crearRouterCitas(crearVerifyRoles(async (uid) => roles.get(uid)), handlers));
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    t.after(() => new Promise((resolve) => server.close(() => resolve())));
    const url = `http://127.0.0.1:${server.address().port}/citas/cita-1/pago/reportar`;
    const post = (uid) => fetch(url, { method: "POST", headers: { "x-user": uid, "content-type": "application/json" }, body: JSON.stringify({ metodoPago: "Efectivo" }) });
    assert.equal((await post("client")).status, 200);
    assert.equal((await post("admin")).status, 403);
    assert.equal((await post("vet")).status, 403);
});

test("el controlador deriva UID de la sesión y no invoca el servicio con payload inválido", async () => {
    let capturado;
    const controller = crearControladorPagosCitas({
        reportar: async (datos) => { capturado = datos; return { pago: { id: datos.citaId, estado: "reportado" } }; },
    });
    const llamar = async (body) => {
        let status;
        let json;
        const res = { status(value) { status = value; return this; }, json(value) { json = value; return this; } };
        await controller.reportar({ userRole: "Cliente", user: { uid: "autenticado" }, params: { id: "cita-1" }, body }, res);
        return { status, json };
    };
    const invalido = await llamar({ metodoPago: "Efectivo", clienteUid: "falso", montoCentavos: 1 });
    assert.equal(invalido.status, 400);
    assert.equal(capturado, undefined);
    const valido = await llamar({ metodoPago: "Tarjeta", referencia: "  REF  " });
    assert.equal(valido.status, 201);
    assert.deepEqual(capturado, { citaId: "cita-1", clienteUid: "autenticado", metodoPago: "Tarjeta", referencia: "REF" });
});

test("el endpoint traduce el rechazo de cita no completada a conflicto HTTP 409", async () => {
    const controller = crearControladorPagosCitas({
        reportar: async () => { throw new ErrorPagoCita("CITA_NO_COMPLETADA"); },
    });
    let status;
    let body;
    const res = {
        status(value) { status = value; return this; },
        json(value) { body = value; return this; },
    };
    await controller.reportar({
        userRole: "Cliente",
        user: { uid: "client-1" },
        params: { id: "cita-1" },
        body: { metodoPago: "Efectivo" },
    }, res);
    assert.equal(status, 409);
    assert.equal(body.code, "CITA_NO_COMPLETADA");
});

test("lista únicamente reportado/en_revision y devuelve información mínima de revisión", async () => {
    const db = new FakeFirestore();
    db.seed("pagos", "cita-1", pagoSeed("reportado", { diagnostico: "dato clínico secreto" }));
    db.seed("pagos", "cita-2", pagoSeed("en_revision", { citaId: "cita-2", clienteUid: "client-2" }));
    db.seed("pagos", "cita-3", pagoSeed("aprobado", { citaId: "cita-3" }));
    db.seed("pagos", "cita-4", pagoSeed("rechazado", { citaId: "cita-4" }));
    db.seed("usuarios", "client-1", { name: "Ana Cliente", email: "ana@example.test", role: "Cliente", telefono: "555", passwordHash: "secret" });
    db.seed("usuarios", "client-2", { name: "Luis Cliente", role: "Cliente" });

    const resultado = await crearServicioPagosCitas(db).listarPendientes();
    assert.deepEqual(resultado.map((pago) => pago.id), ["cita-1", "cita-2"]);
    assert.deepEqual(resultado[0], {
        id: "cita-1", citaId: "cita-1",
        cliente: { uid: "client-1", nombre: "Ana Cliente", email: "ana@example.test" },
        servicio: { id: "service-1", nombre: "Consulta general" },
        montoCentavos: 3250, moneda: "USD", metodoPago: "Transferencia",
        referencia: "REF-001", reportadoAt: "2026-01-02T10:00:00.000Z", estado: "reportado",
    });
    assert.equal(JSON.stringify(resultado).includes("diagnostico"), false);
    assert.equal(JSON.stringify(resultado).includes("passwordHash"), false);
});

test("Administrador y Recepcionista pueden usar las rutas financieras; Cliente y Veterinario reciben 403", async (t) => {
    const roles = new Map([
        ["admin", "Administrador"], ["recepcionista", "Recepcionista"],
        ["cliente", "Cliente"], ["veterinario", "Veterinario"],
    ]);
    const handlers = new Proxy({}, { get: (_target, key) => (_req, res) => res.status(200).json({ ok: true, action: key }) });
    const app = express();
    app.use((req, _res, next) => { req.user = { uid: req.headers["x-user"] }; next(); });
    app.use("/pagos", crearRouterPagos(crearVerifyRoles(async (uid) => roles.get(uid)), handlers));
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    t.after(() => new Promise((resolve) => server.close(() => resolve())));
    const base = `http://127.0.0.1:${server.address().port}/pagos`;
    const solicitudes = [
        ["GET", `${base}/pendientes`],
        ["PATCH", `${base}/cita-1/aprobar`],
        ["PATCH", `${base}/cita-1/rechazar`],
    ];
    for (const uid of ["admin", "recepcionista"]) {
        for (const [method, url] of solicitudes) {
            const response = await fetch(url, { method, headers: { "x-user": uid, "content-type": "application/json" }, body: method === "PATCH" ? JSON.stringify({ motivoRechazo: "Motivo válido" }) : undefined });
            assert.equal(response.status, 200, `${uid} ${method} ${url}`);
        }
    }
    for (const uid of ["cliente", "veterinario"]) {
        for (const [method, url] of solicitudes) {
            const response = await fetch(url, { method, headers: { "x-user": uid, "content-type": "application/json" }, body: method === "PATCH" ? JSON.stringify({ motivoRechazo: "Motivo válido" }) : undefined });
            assert.equal(response.status, 403, `${uid} ${method} ${url}`);
        }
    }
});

test("Administrador y Recepcionista aprueban de forma transaccional sin mutar la cita ni los datos originales", async () => {
    for (const rol of ["Administrador", "Recepcionista"]) {
        const { db, pagos } = inicializar(cita({ estado: "completada" }));
        const original = pagoSeed("en_revision", { verificadoAt: null, verificadorUid: null, verificadorRol: null });
        db.seed("pagos", "cita-1", original);
        db.seed("pagos/cita-1/eventos", "reporte-1", { tipo: "reporte", estado: "reportado", actorUid: "client-1" });

        const resultado = await pagos.aprobar({ citaId: "cita-1", verificadorUid: `staff-${rol}`, verificadorRol: rol });
        const guardado = db.value("pagos", "cita-1");
        assert.equal(guardado.estado, "aprobado");
        assert.equal(guardado.verificadorUid, `staff-${rol}`);
        assert.equal(guardado.verificadorRol, rol);
        assert.ok(guardado.verificadoAt);
        for (const campo of ["montoCentavos", "moneda", "servicioId", "servicioNombre", "metodoPago", "referencia"]) {
            assert.equal(guardado[campo], original[campo], `${campo} debe conservarse`);
        }
        assert.equal(resultado.estado, "aprobado");
        assert.equal(db.value("citas", "cita-1").estado, "completada");
        const eventos = db.collections.get("pagos/cita-1/eventos");
        assert.equal(eventos.size, 2);
        assert.ok([...eventos.values()].some((evento) => evento.tipo === "aprobacion" && evento.actorRol === rol));
        assert.ok(eventos.has("reporte-1"));
    }
});

test("rechazo exige motivo, registra auditoría y permite un nuevo reporte que conserva eventos previos", async () => {
    const { db, pagos } = inicializar(cita({ estado: "completada" }));
    db.seed("pagos", "cita-1", pagoSeed("reportado"));
    db.seed("pagos/cita-1/eventos", "reporte-inicial", { tipo: "reporte", estado: "reportado", actorUid: "client-1", createdAt: "2026-01-02T10:00:00.000Z" });
    const controlador = crearControladorPagos({
        rechazar: pagos.rechazar.bind(pagos),
    });
    const llamar = async (body) => {
        let status;
        let json;
        const res = { status(value) { status = value; return this; }, json(value) { json = value; return this; } };
        await controlador.rechazar({ params: { citaId: "cita-1" }, user: { uid: "recep-1" }, userRole: "Recepcionista", body }, res);
        return { status, json };
    };
    assert.equal((await llamar({})).status, 400);
    assert.equal((await llamar({ motivoRechazo: "  " })).status, 400);
    const rechazo = await llamar({ motivoRechazo: "Referencia no coincide" });
    assert.equal(rechazo.status, 200);
    assert.equal(rechazo.json.data.estado, "rechazado");
    assert.equal(rechazo.json.data.motivoRechazo, "Referencia no coincide");
    assert.equal(db.value("pagos", "cita-1").verificadorUid, "recep-1");
    assert.equal(db.value("pagos", "cita-1").verificadorRol, "Recepcionista");
    assert.equal(db.value("citas", "cita-1").estado, "completada");

    const reintento = await reportar(pagos, { metodoPago: "Efectivo", referencia: "REF-002" });
    assert.equal(reintento.pago.estado, "reportado");
    assert.equal(reintento.pago.numeroIntentos, 2);
    const historial = await pagos.consultar("cita-1", "client-1", "Cliente");
    assert.deepEqual(historial.pago.historial.map((evento) => evento.tipo), ["reporte", "rechazo", "reporte"]);
});

test("rechaza decisiones duplicadas o estados terminales y detecta otro documento aprobado para la cita", async () => {
    const { db, pagos } = inicializar(cita({ estado: "completada" }));
    db.seed("pagos", "cita-1", pagoSeed("reportado"));
    db.seed("pagos/cita-1/eventos", "reporte-inicial", { tipo: "reporte", estado: "reportado", actorUid: "client-1" });
    await pagos.aprobar({ citaId: "cita-1", verificadorUid: "admin-1", verificadorRol: "Administrador" });
    const estadoPago = db.value("pagos", "cita-1");
    const totalEventos = db.collections.get("pagos/cita-1/eventos").size;
    await assert.rejects(pagos.aprobar({ citaId: "cita-1", verificadorUid: "admin-1", verificadorRol: "Administrador" }), { codigo: "PAGO_YA_APROBADO" });
    await assert.rejects(pagos.rechazar({ citaId: "cita-1", verificadorUid: "recep-1", verificadorRol: "Recepcionista", motivoRechazo: "Rechazo duplicado" }), { codigo: "PAGO_YA_APROBADO" });
    assert.deepEqual(db.value("pagos", "cita-1"), estadoPago);
    assert.equal(db.collections.get("pagos/cita-1/eventos").size, totalEventos);

    const otro = inicializar(cita({ estado: "completada" }));
    otro.db.seed("pagos", "cita-1", pagoSeed("reportado"));
    otro.db.seed("pagos", "legacy-payment", pagoSeed("aprobado", { id: "legacy-payment" }));
    await assert.rejects(otro.pagos.aprobar({ citaId: "cita-1", verificadorUid: "admin-1", verificadorRol: "Administrador" }), { codigo: "PAGO_APROBADO_EXISTENTE" });
    assert.equal(otro.db.value("pagos", "cita-1").estado, "reportado");
    assert.equal(otro.db.collections.get("pagos/cita-1/eventos"), undefined);

    const pagoRechazado = inicializar(cita({ estado: "completada" }));
    pagoRechazado.db.seed("pagos", "cita-1", pagoSeed("rechazado"));
    await assert.rejects(pagoRechazado.pagos.aprobar({ citaId: "cita-1", verificadorUid: "admin-1", verificadorRol: "Administrador" }), { codigo: "PAGO_NO_REVISABLE" });
    assert.equal(pagoRechazado.db.value("pagos", "cita-1").estado, "rechazado");
});

test("rechazo acepta en_revision, pero requiere pago existente y conserva estado ante transiciones no permitidas", async () => {
    const { db, pagos } = inicializar(cita({ estado: "completada" }));
    await assert.rejects(pagos.rechazar({ citaId: "cita-1", verificadorUid: "recep-1", verificadorRol: "Recepcionista", motivoRechazo: "No coincide" }), { codigo: "PAGO_NO_ENCONTRADO" });
    db.seed("pagos", "cita-1", pagoSeed("en_revision"));
    const rechazado = await pagos.rechazar({ citaId: "cita-1", verificadorUid: "recep-1", verificadorRol: "Recepcionista", motivoRechazo: "Referencia no coincide" });
    assert.equal(rechazado.estado, "rechazado");
    assert.equal(db.value("pagos", "cita-1").estado, "rechazado");
    await assert.rejects(pagos.rechazar({ citaId: "cita-1", verificadorUid: "recep-1", verificadorRol: "Recepcionista", motivoRechazo: "Otro rechazo" }), { codigo: "PAGO_NO_REVISABLE" });
    assert.equal(db.collections.get("pagos/cita-1/eventos").size, 1);
});

test("aprobación y rechazo concurrentes producen una sola decisión y un solo evento", async () => {
    const { db, pagos } = inicializar(cita({ estado: "completada" }));
    db.seed("pagos", "cita-1", pagoSeed("reportado"));
    db.seed("pagos/cita-1/eventos", "reporte-concurrente", { tipo: "reporte", estado: "reportado", actorUid: "client-1" });
    const decisiones = await Promise.allSettled([
        pagos.aprobar({ citaId: "cita-1", verificadorUid: "admin-1", verificadorRol: "Administrador" }),
        pagos.rechazar({ citaId: "cita-1", verificadorUid: "recep-1", verificadorRol: "Recepcionista", motivoRechazo: "No coincide" }),
    ]);
    assert.equal(decisiones.filter((decision) => decision.status === "fulfilled").length, 1);
    assert.equal(decisiones.filter((decision) => decision.status === "rejected" && ["PAGO_NO_REVISABLE", "PAGO_YA_APROBADO"].includes(decision.reason.codigo)).length, 1);
    assert.ok(["aprobado", "rechazado"].includes(db.value("pagos", "cita-1").estado));
    assert.equal(db.collections.get("pagos/cita-1/eventos").size, 2);
    assert.equal(db.value("citas", "cita-1").estado, "completada");
});

test("controladores usan identidad autenticada y servicios rechazan revisores no autorizados", async () => {
    let capturado;
    const controlador = crearControladorPagos({
        aprobar: async (datos) => { capturado = datos; return { id: datos.citaId, estado: "aprobado" }; },
    });
    let status;
    const res = { status(value) { status = value; return this; }, json() { return this; } };
    await controlador.aprobar({
        params: { citaId: "cita-1" }, user: { uid: "auth-admin" }, userRole: "Administrador",
        body: { verificadorUid: "falso", verificadorRol: "Cliente" },
    }, res);
    assert.equal(status, 400);
    assert.equal(capturado, undefined);

    await controlador.aprobar({
        params: { citaId: "cita-1" }, user: { uid: "auth-recep" }, userRole: "Recepcionista", body: {},
    }, res);
    assert.deepEqual(capturado, { citaId: "cita-1", verificadorUid: "auth-recep", verificadorRol: "Recepcionista" });

    const { pagos } = inicializar(cita({ estado: "completada" }));
    await assert.rejects(pagos.aprobar({ citaId: "cita-1", verificadorUid: "client-1", verificadorRol: "Cliente" }), { codigo: "NO_AUTORIZADO" });
    await assert.rejects(pagos.rechazar({ citaId: "cita-1", verificadorUid: "vet-1", verificadorRol: "Veterinario", motivoRechazo: "No corresponde" }), { codigo: "NO_AUTORIZADO" });
});

test("el controlador de consulta deniega finanzas al Veterinario y oculta citas ajenas al Cliente", async () => {
    const { pagos } = inicializar();
    await reportar(pagos);
    const controller = crearControladorPagosCitas({ consultar: pagos.consultar.bind(pagos) });
    const llamar = async (uid, rol) => {
        let status;
        let json;
        const res = { status(value) { status = value; return this; }, json(value) { json = value; return this; } };
        await controller.consultar({ params: { id: "cita-1" }, user: { uid }, userRole: rol }, res);
        return { status, json };
    };
    assert.equal((await llamar("vet-1", "Veterinario")).status, 403);
    assert.equal((await llamar("client-2", "Cliente")).status, 404);
    assert.equal((await llamar("recep-1", "Recepcionista")).status, 200);
});
