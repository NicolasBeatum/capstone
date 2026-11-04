import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CAMPUS_ID,
  SEMESTERS,
  careerOptions,
  parseCareers,
  semesterOptions,
  validateAcademicSelection,
} from '../src/features/auth/domain/registration.ts';

const careers = [
  { id: '1', name: 'Ingeniería en Informática', campusId: '1' },
  { id: '2', name: 'Administración', campusId: '1' },
  { id: '3', name: 'Diseño', campusId: '20' },
];

test('parseCareers convierte las filas del backend', () => {
  assert.deepEqual(parseCareers([{ id_carrera: 1, nombre_carrera: ' Diseño ', sede_id_sede: 7 }]), [
    { id: '1', name: 'Diseño', campusId: '7' },
  ]);
});

test('los datos inválidos del backend se rechazan', () => {
  assert.throws(() => parseCareers('x'));
  assert.throws(() => parseCareers([{ id_carrera: 'a', nombre_carrera: 'X', sede_id_sede: 1 }]));
  assert.throws(() => parseCareers([{ id_carrera: 1, nombre_carrera: '', sede_id_sede: 1 }]));
});

test('la sede ya no se elige: se usa la sede 1 por defecto', () => {
  assert.equal(DEFAULT_CAMPUS_ID, '1');
  assert.deepEqual(careerOptions(careers).map((option) => option.label), [
    'Administración',
    'Ingeniería en Informática',
  ]);
  assert.deepEqual(careerOptions([{ id: '3', name: 'Diseño', campusId: '20' }]), []);
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
  assert.match(validateAcademicSelection({ careerId: '3', semester: 2 }, careers), /carrera válida/);
  assert.match(validateAcademicSelection({ careerId: '99', semester: 2 }, careers), /carrera válida/);
  assert.match(validateAcademicSelection({ careerId: '1', semester: 14 }, careers), /válido/);
  assert.equal(validateAcademicSelection({ careerId: '1', semester: 13 }, careers), null);
});
