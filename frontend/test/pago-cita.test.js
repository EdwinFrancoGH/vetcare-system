import test from "node:test";
import assert from "node:assert/strict";
import {
    crearPayloadReportePago,
    ETIQUETAS_PAGO_CITA,
    ejecutarUnaVez,
    formatearMontoCita,
    puedeReportarPagoCita,
    tieneTarifaCita,
} from "../src/utils/pagoCita.js";

const citaConTarifa = { servicioId: "consulta", servicioNombre: "Consulta", precioCentavos: 2500, moneda: "USD" };

test("la tarifa histórica requiere fotografía USD válida y se presenta en USD", () => {
    assert.equal(tieneTarifaCita(citaConTarifa), true);
    assert.equal(tieneTarifaCita({}), false);
    assert.equal(formatearMontoCita(2500), "$25.00");
});

test("el estado reportado no se presenta como aprobado y el rechazo permite reintento", () => {
    assert.equal(ETIQUETAS_PAGO_CITA.reportado, "Reportado para revisión");
    assert.equal(ETIQUETAS_PAGO_CITA.aprobado, "Aprobado");
    assert.equal(puedeReportarPagoCita(null), true);
    assert.equal(puedeReportarPagoCita({ estado: "rechazado" }), true);
    for (const estado of ["reportado", "en_revision", "aprobado", "anulado"]) {
        assert.equal(puedeReportarPagoCita({ estado }), false);
    }
});

test("el reporte incluye solo método y referencia opcional, nunca importe o identidad", () => {
    assert.deepEqual(crearPayloadReportePago("Transferencia", " ref-123 "), { metodoPago: "Transferencia", referencia: "ref-123" });
    assert.deepEqual(crearPayloadReportePago("Efectivo", ""), { metodoPago: "Efectivo" });
    assert.throws(() => crearPayloadReportePago("Bitcoin", ""), /método/);
    assert.throws(() => crearPayloadReportePago("Tarjeta", "x".repeat(201)), /200/);
});

test("dos envíos simultáneos para la misma cita ejecutan una sola solicitud", async () => {
    const bloqueos = new Set();
    let solicitudes = 0;
    let liberar;
    const enEspera = new Promise((resolve) => { liberar = resolve; });
    const accion = () => ejecutarUnaVez(bloqueos, "cita-1", async () => {
        solicitudes += 1;
        await enEspera;
    });
    const primero = accion();
    const segundo = accion();
    liberar();
    assert.deepEqual(await Promise.all([primero, segundo]), [true, false]);
    assert.equal(solicitudes, 1);
});
