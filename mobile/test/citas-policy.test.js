import test from 'node:test';
import assert from 'node:assert/strict';
import { clasificarCitaMobile, esRolClienteMobile } from '../src/features/citas/utils/citas-cliente.ts';

test('el flujo Mobile de citas solo se habilita para el rol Cliente', () => {
  assert.equal(esRolClienteMobile('Cliente'), true);
  assert.equal(esRolClienteMobile('Recepcionista'), false);
  assert.equal(esRolClienteMobile('Veterinario'), false);
  assert.equal(esRolClienteMobile('Administrador'), false);
  assert.equal(esRolClienteMobile(null), false);
});

test('citas activas vencidas se muestran en historial y una reservada aparece como perdida', () => {
  const reservada = clasificarCitaMobile({ estado: 'reservada', fecha: '2026-11-04' }, '2026-11-06');
  assert.deepEqual(reservada, { estadoVisible: 'perdida', activa: false, historial: true });

  const confirmada = clasificarCitaMobile({ estado: 'confirmada', fecha: '2026-11-04' }, '2026-11-06');
  assert.deepEqual(confirmada, { estadoVisible: 'confirmada', activa: false, historial: true });
});

test('citas futuras reservadas/confirmadas quedan activas y las terminales quedan en historial', () => {
  assert.deepEqual(
    clasificarCitaMobile({ estado: 'reservada', fecha: '2026-11-07' }, '2026-11-06'),
    { estadoVisible: 'reservada', activa: true, historial: false },
  );
  assert.deepEqual(
    clasificarCitaMobile({ estado: 'completada', fecha: '2026-11-07' }, '2026-11-06'),
    { estadoVisible: 'completada', activa: false, historial: true },
  );
});
