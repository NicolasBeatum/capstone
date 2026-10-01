import assert from 'node:assert/strict';
import test from 'node:test';

import {
  completeAccountDeletion,
  completeStudentProfile,
  deleteStudentAccount,
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
    deleteCurrentAccount: async () => {},
    ...overrides,
  };
}

test('el registro dirige al perfil si hay sesión y a confirmación si no la hay', async () => {
  assert.equal(await registerAccount(' student@example.test ', 'password', gateway()), 'profile');
  assert.equal(
    await registerAccount('student@example.test', 'password', gateway({ register: async () => false })),
    'confirm-email',
  );
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

test('el cierre de cuenta espera confirmación del gateway y propaga fallos', async () => {
  let deleted = false;
  await deleteStudentAccount(gateway({ deleteCurrentAccount: async () => { deleted = true; } }));
  assert.equal(deleted, true);
  await assert.rejects(
    deleteStudentAccount(gateway({ deleteCurrentAccount: async () => { throw new Error('fallo'); } })),
    /fallo/,
  );
});

test('el borrado confirmado limpia primero el dispositivo y conserva sesión si falla Supabase', async () => {
  const steps = [];
  await assert.rejects(completeAccountDeletion({
    clearLocalData: async () => { steps.push('local'); },
    deleteRemoteAccount: async () => { steps.push('remote'); throw new Error('offline'); },
    clearLocalSession: async () => { steps.push('session'); },
  }), /offline/);
  assert.deepEqual(steps, ['local', 'remote']);
});