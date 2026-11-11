import test from 'node:test';
import assert from 'node:assert/strict';
import {
  categoriaEstadoPedido,
  crearServicioPedidosCliente,
  clasificarErrorCancelacion,
  ejecutarCancelacionUnica,
  etiquetaEstadoPedido,
  formatearFechaPedido,
  formatearImportePedido,
  leerRespuestaPedido,
  leerRespuestaPedidos,
  normalizarListaPedidos,
  pedidoPuedeCancelarse,
  reemplazarPedidoEnHistorial,
  sesionPerteneceAUsuario,
} from '../src/features/compras/utils/historial-pedidos.ts';
import { esRolClienteMobile } from '../src/features/citas/utils/citas-cliente.ts';

const pedido = {
  id: 'order-123456789',
  fechaPedido: '2026-11-07T12:30:00.000Z',
  estado: 'pendiente',
  productos: [{ productoId: 'food-1', nombre: 'Alimento', cantidad: 2, precioUnitario: 5.25, subtotal: 10.5 }],
  total: 10.5,
  pagado: false,
  metodoPago: 'Pendiente',
};

test('consulta y cancelación usan rutas propias sin aceptar UID arbitrario', async () => {
  const solicitudes = [];
  const servicio = crearServicioPedidosCliente(async (url, init) => {
    solicitudes.push({ url, init });
    return { ok: true, status: 200, json: async () => ({ data: url.endsWith('/cancelar') ? pedido : [pedido] }) };
  }, 'https://api.example.test');
  assert.equal(servicio.listar.length, 0);
  await servicio.listar();
  await servicio.cancelar('order/id');
  assert.deepEqual(solicitudes, [
    { url: 'https://api.example.test/api/tienda/mis-pedidos', init: undefined },
    { url: 'https://api.example.test/api/tienda/mis-pedidos/order%2Fid/cancelar', init: { method: 'PUT' } },
  ]);
});

test('una respuesta vacía normaliza el historial a una lista vacía', async () => {
  const lista = await leerRespuestaPedidos({ ok: true, status: 200, json: async () => ({ ok: true, data: [] }) });
  assert.deepEqual(lista, []);
  assert.deepEqual(normalizarListaPedidos(null), []);
});

test('mapea únicamente los estados que usa el Backend', () => {
  assert.equal(etiquetaEstadoPedido('pendiente'), 'Pendiente');
  assert.equal(etiquetaEstadoPedido('listo'), 'Listo para retirar');
  assert.equal(etiquetaEstadoPedido('entregado'), 'Entregado');
  assert.equal(etiquetaEstadoPedido('cancelado'), 'Cancelado');
  assert.equal(etiquetaEstadoPedido('preparando'), 'Estado: preparando');
  assert.equal(categoriaEstadoPedido('confirmado'), 'desconocido');
});

test('normaliza productos e importes del pedido sin alterar sus datos', () => {
  const lista = normalizarListaPedidos([pedido]);
  assert.equal(lista[0].productos[0].nombre, 'Alimento');
  assert.equal(lista[0].productos[0].cantidad, 2);
  assert.equal(lista[0].productos[0].precioUnitario, 5.25);
  assert.equal(formatearImportePedido(lista[0].productos[0].subtotal), '$10.50');
  assert.equal(formatearImportePedido(lista[0].total), '$10.50');
  assert.notEqual(formatearFechaPedido(lista[0].fechaPedido), 'Fecha no disponible');
});

test('un error de consulta se propaga para que la pantalla ofrezca reintento', async () => {
  await assert.rejects(
    () => leerRespuestaPedidos({ ok: false, status: 503, json: async () => ({ message: 'Servicio no disponible' }) }),
    /Servicio no disponible/,
  );
});

test('los pedidos cargados solo se publican si sigue activa la misma sesión', () => {
  assert.equal(sesionPerteneceAUsuario('cliente-a', 'cliente-a'), true);
  assert.equal(sesionPerteneceAUsuario('cliente-a', 'cliente-b'), false);
  assert.equal(sesionPerteneceAUsuario('cliente-a', null), false);
});

test('solo el rol Cliente puede entrar a las rutas protegidas de compras', () => {
  assert.equal(esRolClienteMobile('Cliente'), true);
  for (const rol of ['Administrador', 'Recepcionista', 'Veterinario', null, undefined]) {
    assert.equal(esRolClienteMobile(rol), false);
  }
});

test('solo pedidos pendientes ofrecen cancelación', () => {
  assert.equal(pedidoPuedeCancelarse(pedido), true);
  for (const estado of ['listo', 'entregado', 'cancelado']) {
    assert.equal(pedidoPuedeCancelarse({ estado }), false);
  }
});

test('cancelación acepta solo la respuesta confirmada del Backend y reemplaza el pedido', async () => {
  const cancelado = { ...pedido, estado: 'cancelado', motivoCancelacion: 'Cancelado por cliente' };
  const actualizado = await leerRespuestaPedido({ ok: true, status: 200, json: async () => ({ data: cancelado }) });
  assert.equal(actualizado.estado, 'cancelado');
  assert.deepEqual(reemplazarPedidoEnHistorial([pedido], actualizado), [cancelado]);
});

test('un cambio de estado comunicado con 400 o 409 se clasifica como conflicto', async () => {
  for (const status of [400, 409]) assert.equal(clasificarErrorCancelacion(status), 'estado_cambio');
  await assert.rejects(
    () => leerRespuestaPedido({ ok: false, status: 400, json: async () => ({ message: 'El pedido no está pendiente.' }) }),
    (error) => error.status === 400 && /no está pendiente/.test(error.message),
  );
});

test('dos toques concurrentes producen una sola solicitud de cancelación', async () => {
  const operaciones = new Set();
  let llamadas = 0;
  let resolver;
  const primera = ejecutarCancelacionUnica('order-1', operaciones, () => {
    llamadas += 1;
    return new Promise((resolve) => { resolver = resolve; });
  });
  const segunda = await ejecutarCancelacionUnica('order-1', operaciones, async () => {
    llamadas += 1;
    return 'duplicada';
  });
  assert.equal(segunda.ejecutada, false);
  assert.equal(llamadas, 1);
  resolver('confirmada');
  assert.deepEqual(await primera, { ejecutada: true, resultado: 'confirmada' });
  assert.equal(operaciones.has('order-1'), false);
});

test('una sesión nueva no puede publicar datos pertenecientes al UID anterior', () => {
  assert.equal(sesionPerteneceAUsuario('cliente-a', 'cliente-b'), false);
  assert.equal(sesionPerteneceAUsuario('cliente-b', 'cliente-b'), true);
});
