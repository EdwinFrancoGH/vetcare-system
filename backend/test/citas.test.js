import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { crearServicioCitas } from "../src/services/citas.service.js";
import { crearVerifyRoles } from "../src/middlewares/auth.middleware.js";
import { crearRouterCitas } from "../src/routes/citas.routes.js";
import { crearControladorEliminarCita } from "../src/controllers/citas.controller.js";

class FakeFirestore {
    constructor() {
        this.collections = new Map();
        this.sequence = 0;
        this.tail = Promise.resolve();
    }
    collection(name) {
        return {
            doc: (id) => ({ collection: name, id: id || `auto-${++this.sequence}` }),
            where: (field, operator, value) => new FakeQuery(name, [[field, operator, value]])
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
                if (writes.length) throw new Error("Transaction read after write");
                if (ref instanceof FakeQuery) {
                    const docs = [...(this.collections.get(ref.collection) || new Map())]
                        .filter(([, value]) => ref.filters.every(([field, operator, expected]) => operator === "==" && value[field] === expected))
                        .map(([id, value]) => ({ id, data: () => structuredClone(value) }));
                    return { docs, empty: docs.length === 0 };
                }
                const value = this.collections.get(ref.collection)?.get(ref.id);
                return { id: ref.id, exists: value !== undefined, data: () => structuredClone(value) };
            },
            create: (ref, value) => writes.push(["create", ref, value]),
            update: (ref, value) => writes.push(["update", ref, value]),
            delete: (ref) => writes.push(["delete", ref])
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
                } else {
                    collection.delete(ref.id);
                }
            }
            return result;
        } finally { release(); }
    }
    seed(collection, id, value) {
        if (!this.collections.has(collection)) this.collections.set(collection, new Map());
        this.collections.get(collection).set(id, structuredClone(value));
    }
    value(collection, id) { return this.collections.get(collection)?.get(id); }
}

class FakeQuery {
    constructor(collection, filters) { this.collection = collection; this.filters = filters; }
    where(field, operator, value) { return new FakeQuery(this.collection, [...this.filters, [field, operator, value]]); }
}

const datosBase = (extras = {}) => ({
    veterinario: "Dra. Rivera",
    fecha: "2099-01-06",
    hora: "08:00",
    mascotaId: "pet-1",
    propietario: "Ana",
    telefono: "7123-4567",
    motivo: "Consulta general",
    servicioId: "service-1",
    estado: "reservada",
    ...extras
});
const horario = {
    veterinario: "Dra. Rivera",
    duracionCitaMinutos: 60,
    franjas: { martes: { inicio: "08:00", fin: "11:00" } }
};
const inicializar = () => {
    const db = new FakeFirestore();
    db.seed("horariosAtencion", "Dra. Rivera", horario);
    db.seed("mascotas", "pet-1", { propietarioUid: "owner-1", archivada: false });
    db.seed("serviciosVeterinarios", "service-1", {
        nombre: "Consulta general", precioCentavos: 3250, moneda: "USD", activo: true,
    });
    return { db, service: crearServicioCitas(db) };
};

test("crea una cita válida y guarda el dueño desde la mascota y el bloque atómico", async () => {
    const { db, service } = inicializar();
    const result = await service.crearSiDisponible(datosBase(), "owner-1");
    assert.ok(result.cita.id);
    assert.equal(result.cita.clienteUid, "owner-1");
    assert.equal(db.collections.get("citasBloqueos").size, 1);
    assert.equal(db.value("citas", result.cita.id).estado, "reservada");
});

test("crea la cita con fotografía de servicio y tarifa de Firestore, ignorando campos tarifarios del cliente", async () => {
    const { db, service } = inicializar();
    const result = await service.crearSiDisponible(datosBase({
        servicioNombre: "Precio falso", precioCentavos: 1, moneda: "EUR",
    }), "owner-1");
    assert.equal(result.cita.servicioId, "service-1");
    assert.equal(result.cita.servicioNombre, "Consulta general");
    assert.equal(result.cita.precioCentavos, 3250);
    assert.equal(result.cita.moneda, "USD");
    assert.equal("servicioNombre" in db.value("citas", result.cita.id), true);
});

test("rechaza servicio faltante, inexistente, inactivo o con tarifa mal configurada", async () => {
    const { db, service } = inicializar();
    assert.equal((await service.crearSiDisponible(datosBase({ servicioId: "" }), "owner-1")).error, "SERVICIO_REQUERIDO");
    assert.equal((await service.crearSiDisponible(datosBase({ servicioId: "missing" }), "owner-1")).error, "SERVICIO_NO_DISPONIBLE");
    db.seed("serviciosVeterinarios", "inactive", { nombre: "Antiguo", precioCentavos: 1200, moneda: "USD", activo: false });
    assert.equal((await service.crearSiDisponible(datosBase({ servicioId: "inactive" }), "owner-1")).error, "SERVICIO_NO_DISPONIBLE");
    db.seed("serviciosVeterinarios", "invalid", { nombre: "Malo", precioCentavos: 12.5, moneda: "USD", activo: true });
    assert.equal((await service.crearSiDisponible(datosBase({ servicioId: "invalid" }), "owner-1")).error, "SERVICIO_INVALIDO");
});

test("rechaza mascota archivada, de otro dueño, veterinario/horario no configurado y fecha u hora inválidas", async () => {
    const { db, service } = inicializar();
    db.seed("mascotas", "pet-archived", { propietarioUid: "owner-1", archivada: true });
    assert.equal((await service.crearSiDisponible(datosBase({ mascotaId: "pet-archived" }), "owner-1")).error, "MASCOTA_ARCHIVADA");
    assert.equal((await service.crearSiDisponible(datosBase(), "owner-2")).error, "MASCOTA_NO_PROPIA");
    assert.equal((await service.crearSiDisponible(datosBase({ veterinario: "No existe" }), "owner-1")).error, "HORARIO_NO_ENCONTRADO");
    assert.equal((await service.crearSiDisponible(datosBase({ hora: "08:30" }), "owner-1")).error, "HORARIO_INVALIDO");
    assert.equal((await service.crearSiDisponible(datosBase({ fecha: "2099-02-30" }), "owner-1")).error, "HORARIO_INVALIDO");
});

test("rechaza un bloque ya ocupado, incluyendo citas históricas sin documento de bloqueo", async () => {
    const { db, service } = inicializar();
    db.seed("citas", "legacy-1", datosBase());
    const result = await service.crearSiDisponible(datosBase(), "owner-1");
    assert.equal(result.error, "CITA_HORARIO_OCUPADO");
    assert.equal(db.collections.has("citasBloqueos"), false);
});

test("reprograma atómicamente y mueve el bloqueo sin duplicar ni borrar la cita", async () => {
    const { db, service } = inicializar();
    const creada = await service.crearSiDisponible(datosBase(), "owner-1");
    const reprogramada = await service.reprogramarSiDisponible(creada.cita.id, {
        veterinario: "Dra. Rivera", fecha: "2099-01-06", hora: "09:00"
    });
    assert.equal(reprogramada.id, creada.cita.id);
    assert.equal(db.collections.get("citas").size, 1);
    assert.equal(db.value("citas", creada.cita.id).hora, "09:00");
    assert.equal(db.value("citas", creada.cita.id).servicioId, "service-1");
    assert.equal(db.value("citas", creada.cita.id).servicioNombre, "Consulta general");
    assert.equal(db.value("citas", creada.cita.id).precioCentavos, 3250);
    assert.equal(db.value("citas", creada.cita.id).moneda, "USD");
    assert.equal(db.collections.get("citasBloqueos").size, 1);
});

test("actualización genérica rechaza intentos de cambiar servicio o tarifa", async () => {
    const { db, service } = inicializar();
    const created = await service.crearSiDisponible(datosBase(), "owner-1");
    for (const datos of [
        { servicioId: "other" }, { servicioNombre: "Falso" }, { precioCentavos: 1 }, { moneda: "EUR" },
    ]) {
        assert.equal((await service.actualizarSiDisponible(created.cita.id, datos)).error, "CAMPOS_INVALIDOS");
    }
    assert.equal(db.value("citas", created.cita.id).precioCentavos, 3250);
});

test("citas históricas sin servicio siguen actualizándose y reprogramándose sin tarifa automática", async () => {
    const { db, service } = inicializar();
    db.seed("citas", "legacy-no-service", datosBase({ servicioId: undefined, estado: "reservada" }));
    const citaLegacy = db.value("citas", "legacy-no-service");
    delete citaLegacy.servicioId;
    db.seed("citas", "legacy-no-service", citaLegacy);
    assert.equal((await service.actualizarSiDisponible("legacy-no-service", { estado: "confirmada" })).estado, "confirmada");
    const moved = await service.reprogramarSiDisponible("legacy-no-service", {
        veterinario: "Dra. Rivera", fecha: "2099-01-06", hora: "09:00",
    });
    assert.equal(moved.hora, "09:00");
    assert.equal("servicioId" in db.value("citas", "legacy-no-service"), false);
    assert.equal("precioCentavos" in db.value("citas", "legacy-no-service"), false);
});

test("rechaza reprogramar a un bloque ocupado y conserva íntegra la reserva original", async () => {
    const { db, service } = inicializar();
    const creada = await service.crearSiDisponible(datosBase(), "owner-1");
    db.seed("citas", "legacy-2", datosBase({ hora: "09:00", mascotaId: "pet-2", clienteUid: "owner-2" }));
    const result = await service.reprogramarSiDisponible(creada.cita.id, {
        veterinario: "Dra. Rivera", fecha: "2099-01-06", hora: "09:00"
    });
    assert.equal(result.error, "CITA_HORARIO_OCUPADO");
    assert.equal(db.value("citas", creada.cita.id).hora, "08:00");
    assert.equal(db.collections.get("citasBloqueos").size, 1);
});

test("reprogramar vuelve a validar mascota activa, dueño registrado y estado actual", async () => {
    const { db, service } = inicializar();
    const creada = await service.crearSiDisponible(datosBase(), "owner-1");
    db.seed("mascotas", "pet-1", { propietarioUid: "owner-2", archivada: false });
    const cambioPropietario = await service.reprogramarSiDisponible(creada.cita.id, {
        veterinario: "Dra. Rivera", fecha: "2099-01-06", hora: "09:00"
    });
    assert.equal(cambioPropietario.error, "PROPIETARIO_CAMBIADO");
    assert.equal(db.value("citas", creada.cita.id).hora, "08:00");

    db.seed("mascotas", "pet-1", { propietarioUid: "owner-1", archivada: true });
    const archivada = await service.reprogramarSiDisponible(creada.cita.id, {
        veterinario: "Dra. Rivera", fecha: "2099-01-06", hora: "09:00"
    });
    assert.equal(archivada.error, "MASCOTA_ARCHIVADA");
    assert.equal(db.value("citas", creada.cita.id).hora, "08:00");

    db.seed("mascotas", "pet-1", { propietarioUid: "owner-1", archivada: false });
    await service.actualizarSiDisponible(creada.cita.id, { estado: "cancelada" });
    const cancelada = await service.reprogramarSiDisponible(creada.cita.id, {
        veterinario: "Dra. Rivera", fecha: "2099-01-06", hora: "09:00"
    });
    assert.equal(cancelada.error, "ESTADO_NO_REPROGRAMABLE");
    assert.equal(db.value("citas", creada.cita.id).hora, "08:00");
});

test("rechaza transiciones de estado inválidas y libera el bloque al cancelar", async () => {
    const { db, service } = inicializar();
    const creada = await service.crearSiDisponible(datosBase(), "owner-1");
    assert.equal((await service.actualizarSiDisponible(creada.cita.id, { estado: "completada" })).error, "TRANSICION_INVALIDA");
    assert.equal(db.value("citas", creada.cita.id).estado, "reservada");
    assert.equal((await service.actualizarSiDisponible(creada.cita.id, { estado: "confirmada" })).estado, "confirmada");
    assert.equal((await service.actualizarSiDisponible(creada.cita.id, { estado: "completada" })).estado, "completada");
    assert.equal(db.collections.get("citasBloqueos").size, 0);
});

test("solicitudes concurrentes simuladas no crean citas duplicadas para el mismo bloque", async () => {
    const { db, service } = inicializar();
    db.seed("mascotas", "pet-2", { propietarioUid: "owner-2", archivada: false });
    const [primera, segunda] = await Promise.all([
        service.crearSiDisponible(datosBase(), "owner-1"),
        service.crearSiDisponible(datosBase({ mascotaId: "pet-2", propietario: "Luis", telefono: "7234-5678" }), "owner-2")
    ]);
    assert.equal([primera, segunda].filter((result) => result.cita).length, 1);
    assert.equal([primera, segunda].filter((result) => result.error === "CITA_HORARIO_OCUPADO").length, 1);
    assert.equal(db.collections.get("citas").size, 1);
    assert.equal(db.collections.get("citasBloqueos").size, 1);
});

test("el backend rechaza al cliente sin rol de personal en la ruta de reprogramación", async (t) => {
    const app = express();
    app.use((req, _res, next) => { req.user = { uid: "client-1" }; next(); });
    const clienteNoAutorizado = crearVerifyRoles(async () => "Cliente");
    app.use("/citas", crearRouterCitas(clienteNoAutorizado));
    const server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
    const response = await fetch(`http://127.0.0.1:${server.address().port}/citas/cita-1/reprogramar`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ veterinario: "Dra. Rivera", fecha: "2099-01-06", hora: "09:00" })
    });
    assert.equal(response.status, 403);
});

test("la ruta DELETE conserva la cita como cancelación lógica y no permite borrar una completada", async () => {
    let estado = "reservada";
    let eliminaciones = 0;
    const controlador = crearControladorEliminarCita({
        obtenerCita: async () => ({ id: "cita-1", estado }),
        actualizarCita: async (_id, datos) => {
            if (estado === "completada" && datos.estado === "cancelada") return { error: "TRANSICION_INVALIDA" };
            estado = datos.estado;
            return { id: "cita-1", estado };
        },
        eliminarCita: async () => { eliminaciones += 1; }
    });
    const llamar = async () => {
        let codigo;
        let respuesta;
        const res = { status(value) { codigo = value; return this; }, json(value) { respuesta = value; return this; } };
        await controlador({ params: { id: "cita-1" } }, res);
        return { codigo, respuesta };
    };
    const primera = await llamar();
    assert.equal(primera.codigo, 200);
    assert.equal(primera.respuesta.data.estado, "cancelada");
    assert.equal(eliminaciones, 0);
    estado = "completada";
    const completada = await llamar();
    assert.equal(completada.codigo, 409);
    assert.equal(estado, "completada");
});
