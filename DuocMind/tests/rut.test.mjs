import assert from 'node:assert/strict';
import test from 'node:test';

import { formatRut, isRutComplete } from '../src/features/auth/domain/rut.ts';

test('formatRut da formato ##.###.###-# sin importar cómo se escriba', () => {
  assert.equal(formatRut('123456789'), '12.345.678-9');
  assert.equal(formatRut('12.345.678-9'), '12.345.678-9');
  assert.equal(formatRut(' 12 345 678 9 '), '12.345.678-9');
  assert.equal(formatRut('12345678k'), '12.345.678-K');
  assert.equal(formatRut('12345678-k'), '12.345.678-K');
  assert.equal(formatRut('1234567-8'), '1.234.567-8');
});

test('formatRut acompaña al tecleo parcial', () => {
  assert.equal(formatRut(''), '');
  assert.equal(formatRut('1'), '1');
  assert.equal(formatRut('12'), '1-2');
  assert.equal(formatRut('1234'), '123-4');
  assert.equal(formatRut('12345'), '1.234-5');
  assert.equal(formatRut('1234567'), '123.456-7');
});

test('formatRut descarta letras, símbolos y una K fuera del dígito verificador', () => {
  assert.equal(formatRut('abc'), '');
  assert.equal(formatRut('K'), '');
  assert.equal(formatRut('KK'), '');
  assert.equal(formatRut('1K2'), '1-2');
  assert.equal(formatRut('12.34a5.678-9'), '12.345.678-9');
});

test('formatRut ignora los caracteres que sobran y no cambia el dígito verificador', () => {
  assert.equal(formatRut('12.345.678-90'), '12.345.678-9');
  assert.equal(formatRut(formatRut('12345678-9')), '12.345.678-9');
});

test('isRutComplete exige cuerpo y dígito verificador', () => {
  assert.equal(isRutComplete('12.345.678-9'), true);
  assert.equal(isRutComplete('1.234.567-K'), true);
  assert.equal(isRutComplete('1.234.567'), false);
  assert.equal(isRutComplete('123-4'), false);
  assert.equal(isRutComplete(''), false);
});
