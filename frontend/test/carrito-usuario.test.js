import test from 'node:test';
import assert from 'node:assert/strict';
import { obtenerCarritoVisible } from '../src/utils/carritoUsuario.js';

test('el cambio de UID oculta el carrito anterior hasta cargar el del nuevo usuario', () => {
    const carritoAnterior = { uid: 'uid-a', items: [{ productoId: 'private-a' }] };
    assert.deepEqual(obtenerCarritoVisible(carritoAnterior, 'uid-b'), { items: [], cargado: false });
    assert.deepEqual(obtenerCarritoVisible(carritoAnterior, 'uid-a'), {
        items: [{ productoId: 'private-a' }],
        cargado: true,
    });
});

test('una sesión cerrada no muestra elementos del usuario anterior', () => {
    const carritoAnterior = { uid: 'uid-a', items: [{ productoId: 'private-a' }] };
    assert.deepEqual(obtenerCarritoVisible(carritoAnterior, null), { items: [], cargado: true });
});
