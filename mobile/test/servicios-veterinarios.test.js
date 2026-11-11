import test from 'node:test';
import assert from 'node:assert/strict';
import { clasificarCitaMobile } from '../src/features/citas/utils/citas-cliente.ts';
import {
  crearClienteServiciosVeterinarios,
  crearEjecutorReservaUnica,
  crearErrorReservaCita,
  crearPayloadReservaCita,
  formatearPrecioVeterinario,
  formatearTarifaCita,
  normalizarServiciosVeterinarios,
  servicioSeleccionadoActivo,
} from '../src/features/citas/utils/servicios-veterinarios.ts';

const servicio = {
  id: 'service-1', nombre: 'Consulta general', descripcion: 'Evaluacion veterinaria',
  precioCentavos: 3250, moneda: 'USD', activo: true,
};

const respuesta = (payload, ok = true, status = 200) => ({
  ok, status, json: async () => payload,
});

test('consulta GET /api/servicios-veterinarios y conserva el token en los headers habituales', async () => {
  const solicitudes = [];
  const listar = crearClienteServiciosVeterinarios(async (url, init) => {
    solicitudes.push({ url, init });
    return respuesta({ ok: true, data: [servicio] });
  }, 'https://api.example.test');
  const headers = { Authorization: 'Bearer test-token' };
  const data = await listar({ headers });
  assert.deepEqual(data, [servicio]);
  assert.deepEqual(solicitudes, [{ url: 'https://api.example.test/api/servicios-veterinarios', init: { headers } }]);
});

test('normaliza el catálogo, descarta inactivos e inválidos y acepta catálogo vacío', () => {
  assert.deepEqual(normalizarServiciosVeterinarios({ data: [
    servicio,
    { ...servicio, id: 'inactive', activo: false },
    { ...servicio, id: 'bad-price', precioCentavos: 25.5 },
  ] }), [servicio]);
  assert.deepEqual(normalizarServiciosVeterinarios({ data: [] }), []);
});

test('formatea precios con USD y dos decimales', () => {
  const formato = formatearPrecioVeterinario(3250);
  assert.match(formato, /USD/);
  assert.match(formato, /32\.50/);
});

test('la reserva exige que el servicio seleccionado siga activo', () => {
  const activos = normalizarServiciosVeterinarios({ data: [servicio] });
  assert.equal(servicioSeleccionadoActivo('', activos), false);
  assert.equal(servicioSeleccionadoActivo('inactive', activos), false);
  assert.equal(servicioSeleccionadoActivo('service-1', activos), true);
});

test('el payload de reserva incluye servicioId y no incluye precios ni nombre o moneda autoritativos', () => {
  const payload = crearPayloadReservaCita({
    veterinario: 'Dra. Rivera', fecha: '2099-01-06', hora: '08:00', mascotaId: 'pet-1',
    propietario: 'Ana', telefono: '7123-4567', motivo: 'Consulta', servicioId: servicio.id,
  });
  assert.equal(payload.servicioId, servicio.id);
  assert.equal('precioCentavos' in payload, false);
  assert.equal('servicioNombre' in payload, false);
  assert.equal('moneda' in payload, false);
});

test('el servicio reporta con claridad los errores HTTP de catálogo', async () => {
  const listar = crearClienteServiciosVeterinarios(async () => respuesta({ message: 'Sesion expirada' }, false, 401), 'https://api.example.test');
  await assert.rejects(listar(), /Sesion expirada/);
  const invalido = crearClienteServiciosVeterinarios(async () => respuesta({ data: null }), 'https://api.example.test');
  await assert.rejects(invalido(), /respuesta del cat/i);
  const servicioDesactivado = crearErrorReservaCita('El servicio ya no esta activo.', 409, 'SERVICIO_NO_DISPONIBLE');
  assert.equal(servicioDesactivado.status, 409);
  assert.equal(servicioDesactivado.code, 'SERVICIO_NO_DISPONIBLE');
});

test('el ejecutor evita dos reservas simultáneas', async () => {
  const ejecutar = crearEjecutorReservaUnica();
  let terminar;
  let llamadas = 0;
  const primera = ejecutar(() => {
    llamadas += 1;
    return new Promise((resolve) => { terminar = resolve; });
  });
  const segunda = await ejecutar(async () => { llamadas += 1; return 'duplicada'; });
  assert.deepEqual(segunda, { ejecutada: false });
  terminar('reservada');
  assert.deepEqual(await primera, { ejecutada: true, valor: 'reservada' });
  assert.equal(llamadas, 1);
});

test('citas historicas sin tarifa siguen clasificandose y no muestran un importe inventado', () => {
  const citaAntigua = { estado: 'reservada', fecha: '2099-01-06' };
  assert.deepEqual(clasificarCitaMobile(citaAntigua, '2099-01-05'), {
    estadoVisible: 'reservada', activa: true, historial: false,
  });
  assert.equal(formatearTarifaCita(citaAntigua), null);
});
