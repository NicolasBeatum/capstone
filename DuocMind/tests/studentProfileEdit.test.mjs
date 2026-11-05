import assert from 'node:assert/strict';
import test from 'node:test';

import { saveEmail, saveName, savePhone } from '../src/features/settings/application/studentProfileEdit.ts';
import { parseStudentProfile } from '../src/features/settings/domain/studentProfile.ts';
import {
  formatPhone,
  nationalPhone,
  parseEmail,
  parseNames,
  parsePhone,
  sanitizeEmailInput,
  sanitizeNameInput,
  sanitizePhoneInput,
} from '../src/features/settings/domain/studentProfileEdit.ts';

function fakeEditor({ failUpdate = false, failEmail = false } = {}) {
  const calls = { patches: [], emails: [] };
  return {
    calls,
    updateProfile: async (patch) => {
      if (failUpdate) throw new Error('sin red');
      calls.patches.push(patch);
    },
    requestEmailChange: async (email) => {
      if (failEmail) throw new Error('sin red');
      calls.emails.push(email);
    },
  };
}

test('el perfil expone nombres y apellidos por separado para editarlos', () => {
  const profile = parseStudentProfile(
    { primer_nombre: 'Ana', segundo_nombre: 'María', primer_apellido: 'Rojas', segundo_apellido: 'Díaz' },
    null,
    null,
  );
  assert.equal(profile.names, 'Ana María');
  assert.equal(profile.surnames, 'Rojas Díaz');
  assert.equal(profile.fullName, 'Ana María Rojas Díaz');
});

test('los nombres y apellidos se reparten en primer y segundo', () => {
  assert.deepEqual(parseNames('  Ana   María ', 'Rojas Díaz').value, {
    primer_nombre: 'Ana',
    segundo_nombre: 'María',
    primer_apellido: 'Rojas',
    segundo_apellido: 'Díaz',
  });
  assert.deepEqual(parseNames('Ana', 'de la Fuente').value, {
    primer_nombre: 'Ana',
    segundo_nombre: null,
    primer_apellido: 'de',
    segundo_apellido: 'la Fuente',
  });
});

test('el nombre y el apellido son obligatorios y solo admiten letras', () => {
  assert.equal(parseNames('', 'Rojas').ok, false);
  assert.equal(parseNames('Ana', '   ').ok, false);
  assert.equal(parseNames('Ana3', 'Rojas').ok, false);
  assert.equal(parseNames('Ana', 'Rojas@').ok, false);
  assert.equal(parseNames('Ana', 'O’Higgins-Pérez').ok, true);
  assert.equal(parseNames('A'.repeat(101), 'Rojas').ok, false);
});

test('el teléfono es siempre chileno: 9 dígitos tras el +56, y el 9 inicial es editable', () => {
  assert.equal(parsePhone('9 1234 5678').value, '+56912345678');
  assert.equal(parsePhone('2 2345 6789').value, '+56223456789');
  assert.equal(parsePhone('8 1234 5678').value, '+56812345678');
  assert.equal(parsePhone('+56 9 1234-5678').value, '+56912345678');
  assert.equal(parsePhone('56912345678').value, '+56912345678');
  assert.equal(parsePhone('   ').value, null);
  assert.equal(parsePhone('1234').ok, false);
  assert.equal(parsePhone('9 1234 56789').ok, false);
  assert.equal(parsePhone('abc912345678').ok, false);
});

test('el teléfono guardado se muestra con el +56 y se edita sin él', () => {
  assert.equal(formatPhone('+56912345678'), '+56 9 1234 5678');
  assert.equal(formatPhone('+56 9 1234 5678'), '+56 9 1234 5678');
  assert.equal(nationalPhone('+56912345678'), '9 1234 5678');
  assert.equal(nationalPhone(null), '');
  assert.equal(formatPhone('+5491112345678'), '+5491112345678');
});

test('el correo se valida y se guarda en minúsculas', () => {
  assert.equal(parseEmail('  Ana@DuocUC.cl ').value, 'ana@duocuc.cl');
  assert.equal(parseEmail('sin-arroba').ok, false);
  assert.equal(parseEmail('a@b').ok, false);
  assert.equal(parseEmail('').ok, false);
});

test('guardar un dato inválido no llama al backend', async () => {
  const editor = fakeEditor();
  assert.equal((await saveName(editor, '', 'Rojas')).ok, false);
  assert.equal((await savePhone(editor, '123')).ok, false);
  assert.match((await savePhone(editor, '123')).error, /9 dígitos/);
  assert.equal((await saveEmail(editor, 'nada')).ok, false);
  assert.deepEqual(editor.calls, { patches: [], emails: [] });
});

test('guardar nombre y teléfono envía solo las columnas editadas', async () => {
  const editor = fakeEditor();
  assert.deepEqual(await saveName(editor, 'Ana', 'Rojas'), { ok: true });
  assert.deepEqual(await savePhone(editor, '+56 9 1234 5678'), { ok: true });
  assert.deepEqual(await savePhone(editor, ''), { ok: true });
  assert.deepEqual(editor.calls.patches, [
    { primer_nombre: 'Ana', segundo_nombre: null, primer_apellido: 'Rojas', segundo_apellido: null },
    { numero_telefonico: '+56912345678' },
    { numero_telefonico: null },
  ]);
});

test('cambiar el correo pide confirmación y avisa a qué correo llegó el enlace', async () => {
  const editor = fakeEditor();
  const result = await saveEmail(editor, 'Nuevo@duocuc.cl');
  assert.equal(result.ok, true);
  assert.match(result.notice, /nuevo@duocuc\.cl/);
  assert.deepEqual(editor.calls.emails, ['nuevo@duocuc.cl']);
});

test('si el backend falla, el resultado es un error y nunca lanza', async () => {
  const failing = fakeEditor({ failUpdate: true, failEmail: true });
  for (const result of [
    await saveName(failing, 'Ana', 'Rojas'),
    await savePhone(failing, '+56912345678'),
    await saveEmail(failing, 'ana@duocuc.cl'),
  ]) {
    assert.equal(result.ok, false);
    assert.match(result.error, /No se pudo guardar/);
  }
});

test('al escribir, el nombre descarta números y símbolos sin avisar', () => {
  assert.equal(sanitizeNameInput('Ana3 Mar1a'), 'Ana Mara');
  assert.equal(sanitizeNameInput('  Ana   María'), 'Ana María');
  assert.equal(sanitizeNameInput('José@#$%'), 'José');
  assert.equal(sanitizeNameInput("O’Higgins-Pérez"), "O’Higgins-Pérez");
  assert.equal(sanitizeNameInput('Ana -Mar'), 'Ana Mar');
  assert.equal(sanitizeNameInput('ñandú'), 'ñandú');
  assert.equal(sanitizeNameInput('A'.repeat(150)).length, 100);
});

test('al escribir, el teléfono solo admite dígitos y hasta 9', () => {
  assert.equal(sanitizePhoneInput('9a1b2c3'), '9123');
  assert.equal(sanitizePhoneInput('9 1234 5678'), '912345678');
  assert.equal(sanitizePhoneInput('9123456789999'), '912345678');
  assert.equal(sanitizePhoneInput('+56 9 1234 5678'), '912345678');
  assert.equal(sanitizePhoneInput('abc'), '');
});

test('al escribir, el correo no admite espacios ni pasa del largo máximo', () => {
  assert.equal(sanitizeEmailInput(' ana @duocuc.cl '), 'ana@duocuc.cl');
  assert.equal(sanitizeEmailInput('a'.repeat(300)).length, 200);
});
