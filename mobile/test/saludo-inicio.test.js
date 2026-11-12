import test from 'node:test';
import assert from 'node:assert/strict';
import { obtenerSaludo } from '../src/features/inicio/utils/saludo.ts';

const a = (hora, minuto = 0) => new Date(2026, 10, 11, hora, minuto);

test('de 5:00 a 11:59 saluda con "Buenos días"', () => {
  assert.equal(obtenerSaludo(a(5)).texto, 'Buenos días');
  assert.equal(obtenerSaludo(a(11, 59)).icono, 'sunny');
});

test('de 12:00 a 18:59 saluda con "Buenas tardes"', () => {
  assert.equal(obtenerSaludo(a(12)).texto, 'Buenas tardes');
  assert.equal(obtenerSaludo(a(18, 59)).icono, 'partly-sunny');
});

test('de 19:00 a 4:59 saluda con "Buenas noches"', () => {
  assert.equal(obtenerSaludo(a(19)).texto, 'Buenas noches');
  assert.equal(obtenerSaludo(a(0)).icono, 'moon');
  assert.equal(obtenerSaludo(a(4, 59)).texto, 'Buenas noches');
});
