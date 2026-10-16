import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FIRST_NAME_MAX_LENGTH,
  LAST_NAME_MAX_LENGTH,
  sanitizePersonName,
} from '../src/features/auth/domain/personName.ts';

const clean = (input) => sanitizePersonName(input, FIRST_NAME_MAX_LENGTH);

test('sanitizePersonName quita números y símbolos', () => {
  assert.equal(clean('Camila123'), 'Camila');
  assert.equal(clean('M0ra!@#'), 'Mra');
  assert.equal(clean('1234'), '');
});

test('sanitizePersonName conserva tildes, ñ, espacios, guion y apóstrofe', () => {
  assert.equal(clean('María José'), 'María José');
  assert.equal(clean('Núñez'), 'Núñez');
  assert.equal(clean('Pérez-Soto'), 'Pérez-Soto');
  assert.equal(clean("O'Higgins"), "O'Higgins");
});

test('sanitizePersonName colapsa espacios repetidos', () => {
  assert.equal(clean('Ana   María'), 'Ana María');
});

test('sanitizePersonName corta al largo máximo', () => {
  assert.equal(clean('a'.repeat(50)).length, FIRST_NAME_MAX_LENGTH);
  assert.equal(sanitizePersonName('b'.repeat(60), LAST_NAME_MAX_LENGTH).length, LAST_NAME_MAX_LENGTH);
  assert.equal(sanitizePersonName('Camila', 3), 'Cam');
});
