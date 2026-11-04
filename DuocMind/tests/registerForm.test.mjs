import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REGISTER_BLOCKER_HINTS,
  REGISTER_CONSENT_LABELS,
  canSubmitRegistration,
  passwordRequirements,
  passwordStrength,
  registerBlocker,
} from '../src/features/auth/domain/registerForm.ts';
import { NO_CONSENTS } from '../src/shared/consents/domain/consents.ts';

const complete = {
  email: 'camila.soto@duocuc.cl',
  password: 'Clave#2026',
  confirmPassword: 'Clave#2026',
  careerId: '1',
  semester: 3,
  acceptTerms: true,
};

test('los requisitos de contraseña salen en el orden del diseño', () => {
  assert.deepEqual(passwordRequirements('').map((requirement) => requirement.label), [
    'Mínimo 8 caracteres',
    'Una mayúscula',
    'Un número',
    'Un símbolo (@, #)',
  ]);
});

test('el indicador de seguridad sigue la cantidad de requisitos cumplidos', () => {
  const at = (password) => passwordStrength(password);
  assert.deepEqual([at('').metCount, at('').level, at('').label], [0, 'weak', 'Débil']);
  assert.deepEqual([at('abcdefgh').metCount, at('abcdefgh').level], [1, 'weak']);
  assert.deepEqual([at('Abcdefgh').metCount, at('Abcdefgh').level, at('Abcdefgh').label], [2, 'progress', 'En progreso']);
  assert.deepEqual([at('Abcdefg1').metCount, at('Abcdefg1').level, at('Abcdefg1').label], [3, 'almost', 'Casi lista']);
  assert.deepEqual([at('Abcdef1#').metCount, at('Abcdef1#').level, at('Abcdef1#').label], [4, 'strong', 'Segura']);
  assert.equal(at('Abcdef1#').total, 4);
});

test('cada requisito se marca solo cuando se cumple', () => {
  const met = (password) => passwordRequirements(password).filter((r) => r.met).map((r) => r.id);
  assert.deepEqual(met('abc'), []);
  assert.deepEqual(met('ABCDEFGH'), ['length', 'uppercase']);
  assert.deepEqual(met('a1'), ['number']);
  assert.deepEqual(met('a@'), ['symbol']);
});

test('sin la casilla obligatoria de términos no se puede crear la cuenta', () => {
  const state = { ...complete, acceptTerms: false };
  assert.equal(canSubmitRegistration(state), false);
  assert.equal(registerBlocker(state), 'terms');
  assert.match(REGISTER_BLOCKER_HINTS.terms, /obligatoria/);
});

test('con la casilla marcada y todos los datos válidos sí se puede crear la cuenta', () => {
  assert.equal(canSubmitRegistration(complete), true);
  assert.equal(registerBlocker(complete), null);
});

test('si faltan datos o fallan las validaciones el botón sigue deshabilitado', () => {
  const blocked = [
    { ...complete, email: '  ' },
    { ...complete, password: '', confirmPassword: '' },
    { ...complete, confirmPassword: 'otra' },
    { ...complete, password: 'clave', confirmPassword: 'clave' },
    { ...complete, careerId: null },
    { ...complete, semester: null },
  ];
  for (const state of blocked) {
    assert.equal(canSubmitRegistration(state), false);
    assert.equal(registerBlocker(state), 'incomplete');
  }
  assert.ok(REGISTER_BLOCKER_HINTS.incomplete.length > 0);
});

test('los consentimientos opcionales parten desmarcados, nunca premarcados', () => {
  assert.deepEqual(NO_CONSENTS, { shareAnonymousData: false, allowEmergencyContact: false });
});

test('los textos de las tres casillas son los del diseño', () => {
  assert.deepEqual(REGISTER_CONSENT_LABELS, {
    terms: 'Acepto los términos de servicio y la política de privacidad',
    shareAnonymousData: 'Acepto compartir datos anónimos',
    allowEmergencyContact: 'Acepto que se me contacte en caso de emergencia',
  });
});
