import test from 'node:test';
import assert from 'node:assert/strict';
import {
  crearPayloadRechazoPago, ejecutarDecisionPago, esRolRevisorPagos, etiquetaEstadoPago,
  etiquetaEventoPago, formatearFechaPago, formatearImportePago, mensajeErrorPago, puedeDecidirPago,
} from '../src/features/pagos-citas/utils/pagos-admin.ts';
import { crearServicioPagosCitas } from '../src/features/pagos-citas/utils/pagos-admin.service.ts';

test('solo Administrador y Recepcionista son revisores autorizados en la capa Mobile', () => {
  assert.equal(esRolRevisorPagos('Administrador'), true);
  assert.equal(esRolRevisorPagos('Recepcionista'), true);
  assert.equal(esRolRevisorPagos('Cliente'), false);
  assert.equal(esRolRevisorPagos('Veterinario'), false);
});

test('se decide únicamente en estados reportado y en_revision', () => {
  assert.equal(puedeDecidirPago({ estado: 'reportado' }), true);
  assert.equal(puedeDecidirPago({ estado: 'en_revision' }), true);
  for (const estado of ['pendiente', 'aprobado', 'rechazado', 'anulado', 'desconocido']) {
    assert.equal(puedeDecidirPago({ estado }), false);
  }
});

test('rechazo requiere un motivo recortado de 3 a 500 caracteres', () => {
  assert.throws(() => crearPayloadRechazoPago('  '), /3 y 500/);
  assert.throws(() => crearPayloadRechazoPago('x'.repeat(501)), /3 y 500/);
  assert.deepEqual(crearPayloadRechazoPago('  Falta referencia  '), { motivoRechazo: 'Falta referencia' });
});

test('formatters representan importe USD, estados, eventos y fechas reales', () => {
  assert.equal(formatearImportePago(2550, 'USD'), '$25.50');
  assert.equal(formatearImportePago(2550, 'GTQ'), 'Importe no disponible');
  assert.equal(etiquetaEstadoPago('en_revision'), 'En revisión');
  assert.equal(etiquetaEstadoPago('aprobado'), 'Aprobado');
  assert.equal(etiquetaEventoPago('aprobacion'), 'Pago aprobado');
  assert.equal(formatearFechaPago('fecha-invalida'), 'fecha-invalida');
});

test('la decisión realiza una sola solicitud y actualiza información después de aprobar', async () => {
  const bloqueos = new Set();
  let aprobaciones = 0;
  let actualizaciones = 0;
  const servicio = { aprobar: async () => { aprobaciones += 1; }, rechazar: async () => {} };
  const pago = { citaId: 'cita/1', estado: 'reportado' };
  const primero = ejecutarDecisionPago({ pago, decision: 'aprobar', bloqueos, servicio, actualizar: async () => { actualizaciones += 1; } });
  const segundo = ejecutarDecisionPago({ pago, decision: 'aprobar', bloqueos, servicio, actualizar: async () => { actualizaciones += 1; } });
  assert.deepEqual(await Promise.all([primero, segundo]), [true, false]);
  assert.equal(aprobaciones, 1);
  assert.equal(actualizaciones, 1);
});

test('rechazar envía solo el motivo validado y refresca el panel al completar', async () => {
  const llamadas = [];
  let actualizaciones = 0;
  const hecha = await ejecutarDecisionPago({
    pago: { citaId: 'cita-4', estado: 'en_revision' }, decision: 'rechazar', motivo: '  Comprobante ilegible  ',
    bloqueos: new Set(),
    servicio: { aprobar: async () => {}, rechazar: async (...args) => { llamadas.push(args); } },
    actualizar: async () => { actualizaciones += 1; },
  });
  assert.equal(hecha, true);
  assert.deepEqual(llamadas, [['cita-4', 'Comprobante ilegible']]);
  assert.equal(actualizaciones, 1);
});

test('la decisión rechaza estados no revisables sin llamar al servicio y refresca tras conflicto', async () => {
  let llamadas = 0;
  let actualizaciones = 0;
  const servicio = { aprobar: async () => { llamadas += 1; }, rechazar: async () => { llamadas += 1; } };
  assert.equal(await ejecutarDecisionPago({ pago: { citaId: 'x', estado: 'aprobado' }, decision: 'aprobar', bloqueos: new Set(), servicio, actualizar: async () => {} }), false);
  assert.equal(llamadas, 0);
  const err = Object.assign(new Error('conflict'), { status: 409 });
  await assert.rejects(ejecutarDecisionPago({ pago: { citaId: 'y', estado: 'en_revision' }, decision: 'aprobar', bloqueos: new Set(), servicio: { ...servicio, aprobar: async () => { throw err; } }, actualizar: async () => { actualizaciones += 1; } }), /conflict/);
  assert.equal(actualizaciones, 1);
  assert.match(mensajeErrorPago(err), /cambió/);
});

test('el servicio usa rutas y cuerpos exactos y no transmite UID, rol ni campos financieros', async () => {
  const solicitudes = [];
  const request = async (url, init = {}) => {
    solicitudes.push({ url: String(url), method: init.method || 'GET', body: init.body ? JSON.parse(String(init.body)) : undefined });
    return new Response(JSON.stringify({ ok: true, data: url.toString().includes('/pendientes') ? [] : {} }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const servicio = crearServicioPagosCitas(request, 'https://api.test');
  await servicio.obtenerPendientes();
  await servicio.consultarDetalle('cita/2');
  await servicio.aprobar('cita/2');
  await servicio.rechazar('cita/2', 'Motivo válido');
  assert.match(solicitudes[0].url, /\/api\/pagos\/pendientes$/);
  assert.match(solicitudes[1].url, /\/api\/citas\/cita%2F2\/pago$/);
  assert.deepEqual(solicitudes[2].body, {});
  assert.deepEqual(solicitudes[3].body, { motivoRechazo: 'Motivo válido' });
  for (const solicitud of solicitudes) {
    assert.equal(solicitud.body?.uid, undefined);
    assert.equal(solicitud.body?.rol, undefined);
    assert.equal(solicitud.body?.montoCentavos, undefined);
    assert.equal(solicitud.body?.metodoPago, undefined);
    assert.equal(solicitud.body?.referencia, undefined);
  }
});

test('el servicio conserva el estado HTTP para conflictos y errores de autenticación', async () => {
  const servicio = crearServicioPagosCitas(async () => new Response(JSON.stringify({ message: 'Conflicto de estado' }), { status: 409 }), 'https://api.test');
  await assert.rejects(servicio.aprobar('cita-3'), (error) => error.status === 409 && error.message === 'Conflicto de estado');
  assert.match(mensajeErrorPago({ status: 401 }), /sesión expiró/);
  assert.match(mensajeErrorPago({ status: 403 }), /permiso/);
});
