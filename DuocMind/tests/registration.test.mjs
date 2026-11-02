import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SEMESTERS,
  campusOptions,
  careerOptions,
  parseCampuses,
  parseCareers,
  semesterOptions,
  validateAcademicSelection,
} from '../src/features/auth/domain/registration.ts';

const careers = [
  { id: '1', name: 'Ingeniería en Informática', campusId: '10' },
  { id: '2', name: 'Administración', campusId: '10' },
  { id: '3', name: 'Diseño', campusId: '20' },
];

test('parseCampuses y parseCareers convierten las filas del backend', () => {
  assert.deepEqual(parseCampuses([{ id_sede: 7, nombre_sede: ' Plaza Norte ' }]), [{ id: '7', name: 'Plaza Norte' }]);
  assert.deepEqual(parseCareers([{ id_carrera: 1, nombre_carrera: 'Diseño', sede_id_sede: 7 }]), [
    { id: '1', name: 'Diseño', campusId: '7' },
  ]);
});

test('los datos inválidos del backend se rechazan', () => {
  assert.throws(() => parseCampuses('x'));
  assert.throws(() => parseCampuses([{ id_sede: 1, nombre_sede: '' }]));
  assert.throws(() => parseCareers([{ id_carrera: 'a', nombre_carrera: 'X', sede_id_sede: 1 }]));
});

test('CA-002: la carrera solo ofrece las de la sede elegida, ordenadas por nombre', () => {
  assert.deepEqual(careerOptions(careers, '10').map((option) => option.label), [
    'Administración',
    'Ingeniería en Informática',
  ]);
  assert.deepEqual(careerOptions(careers, '20').map((option) => option.key), ['3']);
  assert.deepEqual(careerOptions(careers, null), []);
});

test('las sedes se ordenan por nombre', () => {
  const options = campusOptions([{ id: '2', name: 'Valparaíso' }, { id: '1', name: 'Antonio Varas' }]);
  assert.deepEqual(options.map((option) => option.label), ['Antonio Varas', 'Valparaíso']);
});

test('CA-003: el semestre ofrece del 1 al 13', () => {
  assert.equal(SEMESTERS.length, 13);
  assert.equal(SEMESTERS[0], 1);
  assert.equal(SEMESTERS.at(-1), 13);
  assert.equal(semesterOptions().length, 13);
});

test('CA-004: indica qué falta elegir', () => {
  assert.match(validateAcademicSelection({ campusId: null, careerId: null, semester: null }, careers), /sede/);
  assert.match(validateAcademicSelection({ campusId: '10', careerId: null, semester: null }, careers), /carrera/);
  assert.match(validateAcademicSelection({ campusId: '10', careerId: '1', semester: null }, careers), /semestre/);
  assert.match(validateAcademicSelection({ campusId: '10', careerId: '3', semester: 2 }, careers), /de tu sede/);
  assert.match(validateAcademicSelection({ campusId: '10', careerId: '1', semester: 14 }, careers), /válido/);
  assert.equal(validateAcademicSelection({ campusId: '10', careerId: '1', semester: 13 }, careers), null);
});
