import test from 'node:test';
import assert from 'node:assert/strict';
import { crearGestorCarritoPersistente } from '../src/features/compras/services/carrito-persistente.ts';
import { crearGestorPedidoPendiente } from '../src/features/compras/services/operacion-pendiente.ts';
import { clasificarErrorPedidoHttp } from '../src/features/compras/utils/pedido-error.ts';
import {
  agregarProductoDesdeDetalle,
  actualizarCarritoConCatalogo,
  compararCarritoConCatalogo,
  iconoCategoriaProducto,
  limitarCantidadProducto,
  normalizarImagenHttps,
  productoActivoDisponible,
  resolverImagenProducto,
  rutaDetalleProducto,
} from '../src/features/compras/utils/producto-tienda.ts';

const producto = {
  id: 'food/one', nombre: 'Alimento', categoria: 'Comida', precio: 7.5, stock: 30,
  descripcion: 'Alimento seco', imagenUrl: 'https://cdn.example.test/food.png', activo: true,
};

class MemoryStorage {
  values = new Map();
  async getItem(key) { return this.values.get(key) ?? null; }
  async setItem(key, value) { this.values.set(key, value); }
  async removeItem(key) { this.values.delete(key); }
}

test('la URL de imagen acepta HTTPS válido y rechaza esquemas inseguros o datos inválidos', () => {
  assert.equal(normalizarImagenHttps(producto.imagenUrl), producto.imagenUrl);
  assert.equal(normalizarImagenHttps('http://example.test/image.png'), null);
  assert.equal(normalizarImagenHttps('javascript:alert(1)'), null);
  assert.equal(normalizarImagenHttps('invalid url'), null);
});

test('sin URL o después de un error de carga se resuelve la alternativa por categoría', () => {
  assert.equal(resolverImagenProducto('', false), null);
  assert.equal(resolverImagenProducto(producto.imagenUrl, true), null);
  assert.equal(resolverImagenProducto(producto.imagenUrl, false)?.uri, producto.imagenUrl);
  assert.equal(iconoCategoriaProducto('Comida'), 'nutrition-outline');
  assert.equal(iconoCategoriaProducto('Otra'), 'paw-outline');
});

test('el catálogo descarta inactivos y productos sin existencias', () => {
  assert.equal(productoActivoDisponible(producto), true);
  assert.equal(productoActivoDisponible({ ...producto, activo: false }), false);
  assert.equal(productoActivoDisponible({ ...producto, stock: 0 }), false);
});

test('la consulta individual apunta al endpoint de detalle y codifica el identificador', () => {
  assert.equal(rutaDetalleProducto('food/one'), '/api/tienda/productos/food%2Fone');
});

test('las cantidades respetan existencias, máximo 20 y rechazan entradas inválidas', () => {
  assert.equal(limitarCantidadProducto(40, 30), 20);
  assert.equal(limitarCantidadProducto(40, 4), 4);
  assert.equal(limitarCantidadProducto(Number.NaN, 4), 0);
  assert.equal(limitarCantidadProducto(2, 0), 0);
});

test('agregar desde la ficha actualiza el carrito persistente por UID sin exceder stock', async () => {
  const storage = new MemoryStorage();
  const carrito = crearGestorCarritoPersistente(storage);
  const operaciones = { hayPendiente: async () => false };
  const agregado = await agregarProductoDesdeDetalle('cliente-a', producto, 25, operaciones, carrito);
  assert.equal(agregado, 20);
  const guardado = await carrito.cargar('cliente-a');
  assert.equal(guardado.carrito[producto.id].cantidad, 20);
  assert.equal((await carrito.cargar('cliente-b')), null);
});

test('desde la ficha no se agrega un producto agotado ni si ya hay una operación pendiente', async () => {
  const storage = new MemoryStorage();
  const carrito = crearGestorCarritoPersistente(storage);
  const vacio = await agregarProductoDesdeDetalle('cliente-a', { ...producto, stock: 0 }, 1, { hayPendiente: async () => false }, carrito);
  assert.equal(vacio, 0);
  await assert.rejects(
    () => agregarProductoDesdeDetalle('cliente-a', producto, 1, { hayPendiente: async () => true }, carrito),
    /pedido pendiente/,
  );
});

test('los reintentos reutilizan la clave y conservan la huella del payload', async () => {
  const storage = new MemoryStorage();
  const gestor = crearGestorPedidoPendiente(storage);
  const payload = { productos: [{ productoId: producto.id, cantidad: 2 }], tipo: 'retiro' };
  const primeraClave = await gestor.obtener('cliente-a', payload);
  const claveReintento = await gestor.obtener('cliente-a', payload);
  assert.equal(claveReintento, primeraClave);
  await assert.rejects(() => gestor.obtener('cliente-a', { ...payload, productos: [{ productoId: producto.id, cantidad: 1 }] }), /operación pendiente/);
  assert.equal(await gestor.hayPendiente('cliente-a'), true);
});

test('las operaciones pendientes se aíslan por UID', async () => {
  const gestor = crearGestorPedidoPendiente(new MemoryStorage());
  const payload = { productos: [{ productoId: producto.id, cantidad: 1 }], tipo: 'retiro' };
  const [claveA, claveB] = await Promise.all([gestor.obtener('cliente-a', payload), gestor.obtener('cliente-b', payload)]);
  assert.notEqual(claveA, claveB);
  assert.equal(await gestor.hayPendiente('cliente-a'), true);
  assert.equal(await gestor.hayPendiente('cliente-b'), true);
});

test('errores de conexión, 409 y 5xx son ambiguos; 400/404 son definitivos y auth se conserva', () => {
  assert.equal(clasificarErrorPedidoHttp(undefined), 'ambiguo');
  assert.equal(clasificarErrorPedidoHttp(409), 'ambiguo');
  assert.equal(clasificarErrorPedidoHttp(500), 'ambiguo');
  assert.equal(clasificarErrorPedidoHttp(400), 'definitivo');
  assert.equal(clasificarErrorPedidoHttp(404), 'definitivo');
  assert.equal(clasificarErrorPedidoHttp(401), 'autenticacion');
  assert.equal(clasificarErrorPedidoHttp(403), 'autenticacion');
});

test('un rechazo definitivo solo elimina la clave si coinciden clave y payload; luego permite corregir y reiniciar', async () => {
  const storage = new MemoryStorage();
  const gestor = crearGestorPedidoPendiente(storage);
  const original = { productos: [{ productoId: producto.id, cantidad: 30 }], tipo: 'retiro' };
  const key = await gestor.obtener('cliente-a', original);
  assert.equal(await gestor.resolverRechazoDefinitivo('cliente-a', key, { ...original, tipo: 'en_linea' }), false);
  assert.equal(await gestor.hayPendiente('cliente-a'), true);
  assert.equal(await gestor.resolverRechazoDefinitivo('cliente-a', key, original), true);
  assert.equal(await gestor.hayPendiente('cliente-a'), false);
  const corrected = { productos: [{ productoId: producto.id, cantidad: 20 }], tipo: 'retiro' };
  assert.notEqual(await gestor.obtener('cliente-a', corrected), key);
});

test('errores ambiguos y de autenticación no resuelven automáticamente la operación pendiente', async () => {
  const storage = new MemoryStorage();
  const gestor = crearGestorPedidoPendiente(storage);
  const payload = { productos: [{ productoId: producto.id, cantidad: 1 }], tipo: 'retiro' };
  const key = await gestor.obtener('cliente-a', payload);
  for (const status of [undefined, 401, 403, 409, 500]) {
    assert.notEqual(clasificarErrorPedidoHttp(status), 'definitivo');
    assert.equal(await gestor.hayPendiente('cliente-a'), true);
    assert.equal(await gestor.obtener('cliente-a', payload), key);
  }
});

test('una operación repetida simulada con la misma clave no crea pedidos duplicados', async () => {
  const storage = new MemoryStorage();
  const gestor = crearGestorPedidoPendiente(storage);
  const payload = { productos: [{ productoId: producto.id, cantidad: 1 }], tipo: 'retiro' };
  const pedidosPorClave = new Map();
  const procesar = async () => {
    const key = await gestor.obtener('cliente-a', payload);
    if (!pedidosPorClave.has(key)) pedidosPorClave.set(key, { id: 'order-1' });
    return pedidosPorClave.get(key);
  };
  const [primero, reintento] = await Promise.all([procesar(), procesar()]);
  assert.equal(primero.id, reintento.id);
  assert.equal(pedidosPorClave.size, 1);
});

test('actualizar catálogo informa cambios y conserva cantidades para corrección manual', () => {
  const carrito = { [producto.id]: { producto, cantidad: 8 } };
  const catalogo = [{ ...producto, precio: 8, stock: 4 }];
  const revision = compararCarritoConCatalogo(carrito, catalogo);
  assert.equal(revision.requiereActualizar, true);
  assert.equal(revision.problemas.length, 1);
  const actualizado = actualizarCarritoConCatalogo(carrito, catalogo);
  assert.equal(actualizado[producto.id].cantidad, 8);
  assert.equal(actualizado[producto.id].producto.precio, 8);
  assert.equal(actualizado[producto.id].producto.stock, 4);
});
