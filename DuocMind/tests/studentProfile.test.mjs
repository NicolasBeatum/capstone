import assert from 'node:assert/strict';
import test from 'node:test';

import { loadStudentProfile } from '../src/features/settings/application/studentProfile.ts';
import {
  displayValue,
  parseCareerName,
  parseStudentProfile,
} from '../src/features/settings/domain/studentProfile.ts';

const ROW = {
  rut: '12.345.678-9',
  primer_nombre: ' Camila ',
  segundo_nombre: null,
  primer_apellido: 'Mora',
  segundo_apellido: '',
  numero_telefonico: '+56 9 1234 5678',
  correo: 'copiado@perfil.cl',
};

test('arma el nombre completo con las partes presentes', () => {
  const profile = parseStudentProfile(ROW, 'Ingeniería en Informática', 'cuenta@duocuc.cl');
  assert.equal(profile.fullName, 'Camila Mora');
  assert.equal(profile.rut, '12.345.678-9');
  assert.equal(profile.phone, '+56 9 1234 5678');
  assert.equal(profile.career, 'Ingeniería en Informática');
});

test('el correo de la cuenta manda sobre el copiado en el perfil', () => {
  assert.equal(parseStudentProfile(ROW, null, 'cuenta@duocuc.cl').email, 'cuenta@duocuc.cl');
  assert.equal(parseStudentProfile(ROW, null, null).email, 'copiado@perfil.cl');
});

test('los datos que no se registraron quedan en null y se muestran como «No registrado»', () => {
  const profile = parseStudentProfile({ primer_nombre: 'Ana', primer_apellido: 'Rojas' }, null, null);
  assert.equal(profile.phone, null);
  assert.equal(profile.career, null);
  assert.equal(profile.rut, null);
  assert.equal(displayValue(profile.phone), 'No registrado');
  assert.equal(displayValue('x'), 'x');
});

test('sin nombre ni apellido o con una fila inválida no hay perfil', () => {
  assert.equal(parseStudentProfile({ rut: '1-9' }, null, null), null);
  assert.equal(parseStudentProfile(null, null, null), null);
  assert.equal(parseStudentProfile([ROW], null, null), null);
  assert.equal(parseStudentProfile({ primer_nombre: 42, primer_apellido: {} }, null, null), null);
});

test('la carrera se lee de una fila embebida como objeto o como lista', () => {
  assert.equal(parseCareerName({ carrera: { nombre_carrera: 'Enfermería' } }), 'Enfermería');
  assert.equal(parseCareerName({ carrera: [{ nombre_carrera: 'Enfermería' }] }), 'Enfermería');
  assert.equal(parseCareerName({ carrera: null }), null);
  assert.equal(parseCareerName(null), null);
  assert.equal(parseCareerName({ carrera: { nombre_carrera: '   ' } }), null);
});

test('cargar el perfil devuelve el resultado del gateway y nunca lanza', async () => {
  const profile = parseStudentProfile(ROW, null, null);
  assert.deepEqual(await loadStudentProfile({ fetchProfile: async () => profile }), { profile, failed: false });
  assert.deepEqual(await loadStudentProfile({ fetchProfile: async () => null }), { profile: null, failed: false });
  assert.deepEqual(
    await loadStudentProfile({
      fetchProfile: async () => {
        throw new Error('sin red');
      },
    }),
    { profile: null, failed: true },
  );
});
