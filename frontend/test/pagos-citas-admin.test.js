import test from "node:test";
import assert from "node:assert/strict";
import { crearServicioPagosCitasWeb } from "../src/utils/pagosCitasAdmin.js";
import {
    crearPayloadRechazoPago,
    ejecutarDecisionPago,
    etiquetaEstadoPago,
    etiquetaEventoPago,
    esRolRevisorPagos,
    extraerPagoDetalle,
    extraerListaPagos,
    formatearImportePago,
    mensajeErrorPago,
    puedeDecidirPago,
    ROLES_REVISORES_PAGOS,
} from "../src/utils/pagosCitasAdmin.js";

const pago = { id: "pay-1", citaId: "cita/1", estado: "reportado", montoCentavos: 4275, moneda: "USD" };

test("el cliente API utiliza las rutas reales y solo envía motivo al rechazar", async () => {
    const llamadas = [];
    const api = {
        get: async (...args) => { llamadas.push(["GET", ...args]); return { data: { data: [] } }; },
        patch: async (...args) => { llamadas.push(["PATCH", ...args]); return { data: { ok: true } }; },
    };
    const servicio = crearServicioPagosCitasWeb(api);
    await servicio.obtenerPendientes();
    await servicio.consultarDetalle("cita/1");
    await servicio.aprobar("cita/1");
    await servicio.rechazar("cita/1", "No coincide");
    assert.deepEqual(llamadas, [
        ["GET", "/pagos/pendientes"],
        ["GET", "/citas/cita%2F1/pago"],
        ["PATCH", "/pagos/cita%2F1/aprobar", {}],
        ["PATCH", "/pagos/cita%2F1/rechazar", { motivoRechazo: "No coincide" }],
    ]);
    assert.equal(JSON.stringify(llamadas).includes("UID"), false);
    assert.equal(JSON.stringify(llamadas).includes("verificador"), false);
    assert.equal(JSON.stringify(llamadas).includes("montoCentavos"), false);
});

test("solo Administrador y Recepcionista pasan el rol de revisión, y solo estados revisables habilitan acciones", () => {
    assert.deepEqual(ROLES_REVISORES_PAGOS, ["Administrador", "Recepcionista"]);
    assert.equal(esRolRevisorPagos("Administrador"), true);
    assert.equal(esRolRevisorPagos("Recepcionista"), true);
    assert.equal(esRolRevisorPagos("Cliente"), false);
    assert.equal(esRolRevisorPagos("Veterinario"), false);
    assert.equal(puedeDecidirPago(pago), true);
    assert.equal(puedeDecidirPago({ ...pago, estado: "en_revision" }), true);
    for (const estado of ["pendiente", "aprobado", "rechazado", "anulado"]) {
        assert.equal(puedeDecidirPago({ ...pago, estado }), false);
    }
});

test("importe, método de estado e historial usan valores reales y no fabrican eventos", () => {
    assert.equal(formatearImportePago(4275, "USD"), "$42.75");
    assert.equal(formatearImportePago(4275, "GTQ"), "Importe no disponible");
    assert.equal(etiquetaEstadoPago("en_revision"), "En revisión");
    assert.equal(etiquetaEventoPago({ tipo: "reporte", intento: 2 }), "Reporte del cliente · intento 2");
    assert.equal(etiquetaEventoPago({ tipo: "rechazo" }), "Pago rechazado");
    const eventos = [{ tipo: "reporte", estado: "reportado" }, { tipo: "aprobacion", estado: "aprobado" }];
    const detalle = extraerPagoDetalle({ data: { data: { citaId: "cita-1", historial: eventos } } });
    assert.deepEqual(detalle.historial, eventos);
    assert.deepEqual(extraerListaPagos({ data: { data: [pago] } }), [pago]);
    assert.deepEqual(extraerListaPagos({ data: { data: null } }), []);
});

test("el motivo de rechazo se normaliza y valida en el rango del Backend", () => {
    assert.deepEqual(crearPayloadRechazoPago("  No coincide  "), { motivoRechazo: "No coincide" });
    for (const motivo of ["", "  ", "ab", "x".repeat(501)]) {
        assert.throws(() => crearPayloadRechazoPago(motivo), /3 y 500/);
    }
});

test("una decisión exitosa actualiza la lista y evita dobles envíos concurrentes", async () => {
    const bloqueos = new Set();
    let decisiones = 0;
    let refrescos = 0;
    let liberar;
    const espera = new Promise((resolve) => { liberar = resolve; });
    const servicio = {
        aprobar: async () => { decisiones += 1; await espera; },
        rechazar: async () => { throw new Error("No debe rechazar aquí"); },
    };
    const ejecutar = () => ejecutarDecisionPago({ pago, decision: "aprobar", bloqueos, servicio, actualizar: async () => { refrescos += 1; } });
    const primero = ejecutar();
    const segundo = ejecutar();
    liberar();
    assert.deepEqual(await Promise.all([primero, segundo]), [true, false]);
    assert.equal(decisiones, 1);
    assert.equal(refrescos, 1);
});

test("un conflicto fuerza una actualización antes de mostrar el error", async () => {
    const bloqueos = new Set();
    let refrescos = 0;
    const conflicto = Object.assign(new Error("Ya cambió"), { response: { status: 409 } });
    await assert.rejects(ejecutarDecisionPago({
        pago,
        decision: "aprobar",
        bloqueos,
        servicio: { aprobar: async () => { throw conflicto; } },
        actualizar: async () => { refrescos += 1; },
    }), /Ya cambió/);
    assert.equal(refrescos, 1);
    assert.match(mensajeErrorPago(conflicto), /cambió/i);
});

test("errores de sesión y autorización se traducen en mensajes claros", () => {
    assert.match(mensajeErrorPago({ response: { status: 401 } }), /sesión expiró/i);
    assert.match(mensajeErrorPago({ response: { status: 403 } }), /permiso/i);
});
