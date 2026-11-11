import test from 'node:test';
import assert from 'node:assert/strict';
import {
  crearPayloadReportePago,
  ejecutarUnaVez,
  etiquetaEstadoPago,
  formatearMontoPagoCita,
  puedeReportarPagoCita,
  tieneTarifaCita,
} from '../src/features/citas/utils/pago-cita.ts';

const citaConTarifa = { servicioId: 'consulta', servicioNombre: 'Consulta', precioCentavos: 3250, moneda: 'USD' };

test('la cita histórica sin fotografía de tarifa conserva compatibilidad y no muestra precio inventado', () => {
  assert.equal(tieneTarifaCita(citaConTarifa), true);
  assert.equal(tieneTarifaCita({}), false);
  assert.equal(formatearMontoPagoCita(3250), '$32.50');
});

test('los estados del backend se mapean sin confundir reporte con aprobación', () => {
  assert.equal(etiquetaEstadoPago('reportado'), 'Reportado para revisión');
  assert.equal(etiquetaEstadoPago('en_revision'), 'En revisión');
  assert.equal(etiquetaEstadoPago('aprobado'), 'Aprobado');
  assert.equal(puedeReportarPagoCita(null), true);
  assert.equal(puedeReportarPagoCita({ estado: 'rechazado', montoCentavos: 3250, moneda: 'USD' }), true);
  for (const estado of ['reportado', 'en_revision', 'aprobado', 'anulado']) {
    assert.equal(puedeReportarPagoCita({ estado, montoCentavos: 3250, moneda: 'USD' }), false);
  }
});

test('el payload contiene método y referencia opcional, sin datos financieros autoritativos ni UID', () => {
  assert.deepEqual(crearPayloadReportePago('Tarjeta', '  ref  '), { metodoPago: 'Tarjeta', referencia: 'ref' });
  assert.deepEqual(crearPayloadReportePago('Efectivo', ''), { metodoPago: 'Efectivo' });
  assert.throws(() => crearPayloadReportePago('Cheque', ''), /método/);
  assert.throws(() => crearPayloadReportePago('Transferencia', 'r'.repeat(201)), /200/);
});

test('dos intentos simultáneos de la misma cita producen una sola solicitud', async () => {
  const bloqueos = new Set();
  let solicitudes = 0;
  let liberar;
  const enEspera = new Promise((resolve) => { liberar = resolve; });
  const accion = () => ejecutarUnaVez(bloqueos, 'cita-1', async () => {
    solicitudes += 1;
    await enEspera;
  });
  const primero = accion();
  const segundo = accion();
  liberar();
  assert.deepEqual(await Promise.all([primero, segundo]), [true, false]);
  assert.equal(solicitudes, 1);
});
