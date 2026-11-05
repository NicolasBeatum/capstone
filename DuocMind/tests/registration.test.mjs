import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SEMESTERS,
  careerOptions,
  parseCareers,
  semesterOptions,
  validateAcademicSelection,
} from '../src/features/auth/domain/registration.ts';

const careers = [
  { id: '1', name: 'Ingeniería en Informática' },
  { id: '2', name: 'Administración' },
];

test('parseCareers convierte las filas del backend', () => {
  assert.deepEqual(parseCareers([{ id_carrera: 1, nombre_carrera: ' Diseño ' }]), [
    { id: '1', name: 'Diseño' },
  ]);
});

test('los datos inválidos del backend se rechazan', () => {
  assert.throws(() => parseCareers('x'));
  assert.throws(() => parseCareers([{ id_carrera: 'a', nombre_carrera: 'X' }]));
  assert.throws(() => parseCareers([{ id_carrera: 1, nombre_carrera: '' }]));
});

test('las carreras se ofrecen ordenadas por nombre', () => {
  assert.deepEqual(careerOptions(careers).map((option) => option.label), [
    'Administración',
    'Ingeniería en Informática',
  ]);
});

test('CA-003: el semestre ofrece del 1 al 13', () => {
  assert.equal(SEMESTERS.length, 13);
  assert.equal(SEMESTERS[0], 1);
  assert.equal(SEMESTERS.at(-1), 13);
  assert.equal(semesterOptions().length, 13);
});

test('CA-004: indica qué falta elegir', () => {
  assert.match(validateAcademicSelection({ careerId: null, semester: null }, careers), /carrera/);
  assert.match(validateAcademicSelection({ careerId: '1', semester: null }, careers), /semestre/);
  assert.match(validateAcademicSelection({ careerId: '99', semester: 2 }, careers), /carrera válida/);
  assert.match(validateAcademicSelection({ careerId: '1', semester: 14 }, careers), /válido/);
  assert.equal(validateAcademicSelection({ careerId: '1', semester: 13 }, careers), null);
});
