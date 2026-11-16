import test from 'node:test';
import assert from 'node:assert/strict';
import { BREATH_CYCLES, breathMomentAt, circleScale } from '../src/features/wellness/domain/breathing478.ts';

test('sigue el orden inhala 4, aguanta 7, exhala 8', () => {
  assert.equal(breathMomentAt(0).phase.kind, 'inhale');
  assert.equal(breathMomentAt(4).phase.kind, 'hold');
  assert.equal(breathMomentAt(11).phase.kind, 'exhale');
  assert.equal(breathMomentAt(19).cycle, 2);
});

test('el avance va de 0 a 1 dentro de cada fase', () => {
  assert.equal(breathMomentAt(2).progress, 0.5);
  assert.equal(breathMomentAt(15).progress, 0.5);
});

test('termina después de los ciclos fijos', () => {
  assert.notEqual(breathMomentAt(BREATH_CYCLES * 19 - 0.1), null);
  assert.equal(breathMomentAt(BREATH_CYCLES * 19), null);
});

test('el círculo crece al inhalar, se queda al aguantar y se achica al exhalar', () => {
  assert.equal(circleScale(breathMomentAt(0)), 0.6);
  assert.equal(circleScale(breathMomentAt(6)), 1);
  assert.equal(circleScale(breathMomentAt(18.99)) < 0.61, true);
});
