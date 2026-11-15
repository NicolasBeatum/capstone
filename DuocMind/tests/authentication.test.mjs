import assert from 'node:assert/strict';
import test from 'node:test';

import {
  completeStudentProfile,
  loginAccount,
  registerAccount,
} from '../src/features/auth/application/authentication.ts';

function gateway(overrides = {}) {
  return {
    register: async () => true,
    signIn: async () => {},
    getCurrentUserId: async () => null,
    hasStudentProfile: async () => false,
    createStudentProfile: async () => {},
    requestPasswordReset: async () => {},
    signOut: async () => {},
    pendingAccountDeletion: async () => null,
    scheduleAccountDeletion: async () => '2026-12-15T12:00:00.000Z',
    cancelAccountDeletion: async () => {},
    ...overrides,
  };
}

test('el registro dirige al perfil si hay sesión y a confirmación si no la hay', async () => {
  assert.equal(await registerAccount(' student@example.test ', 'password', 4, gateway()), 'profile');
  assert.equal(
    await registerAccount('student@example.test', 'password', 4, gateway({ register: async () => false })),
    'confirm-email',
  );
});

test('el registro envía la carrera elegida junto con la cuenta', async () => {
  const calls = [];
  await registerAccount('student@example.test', 'password', 7, gateway({
    register: async (...args) => { calls.push(args); return true; },
  }));
  assert.deepEqual(calls, [['student@example.test', 'password', 7]]);
});

test('el inicio de sesión exige completar el perfil antes del dashboard', async () => {
  assert.equal(await loginAccount('student@example.test', 'password', gateway()), 'profile');
  assert.equal(
    await loginAccount('student@example.test', 'password', gateway({ hasStudentProfile: async () => true })),
    'dashboard',
  );
});

test('el onboarding normaliza campos y rechaza perfiles incompletos', async () => {
  let savedProfile;
  await completeStudentProfile(
    { rut: ' 12.345.678-9 ', firstName: ' Camila ', lastName: ' Mora ' },
    gateway({ createStudentProfile: async (profile) => { savedProfile = profile; } }),
  );
  assert.deepEqual(savedProfile, { rut: '12.345.678-9', firstName: 'Camila', lastName: 'Mora' });
  await assert.rejects(
    completeStudentProfile({ rut: '', firstName: 'Camila', lastName: 'Mora' }, gateway()),
    /Completa el RUT/,
  );
});

test('con una eliminación de cuenta pendiente el inicio de sesión ofrece cancelarla', async () => {
  assert.equal(
    await loginAccount('student@example.test', 'password', gateway({
      hasStudentProfile: async () => true,
      pendingAccountDeletion: async () => '2026-12-15T12:00:00.000Z',
    })),
    'account-deletion',
  );
});
