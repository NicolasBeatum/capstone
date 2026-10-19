import test from 'node:test';
import assert from 'node:assert/strict';
import {
  activateSemester,
  emptySchedule,
  parseSchedule,
  putSemester,
  putSubject,
  removeSubject,
} from '../src/shared/planner/domain/schedule.ts';
export const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const semester = (n) => ({ id: id(n), name: `Semestre ${n}`, startsOn: null, endsOn: null });
test('primer semestre activo y cambios conservan semestres anteriores', () => {
  const a = putSemester(emptySchedule(), semester(1)), b = putSemester(a, semester(2));
  assert.equal(b.activeSemesterId, id(1));
  assert.equal(activateSemester(b, id(2)).semesters.length, 2);
  assert.equal(a.semesters.length, 1);
  assert.throws(() => activateSemester(b, id(99)));
});
test('ramos manuales sin sigla ni sección; borrar no cambia otros semestres', () => {
  const a = putSemester(emptySchedule(), semester(1));
  const b = putSubject(a, {
    id: id(3),
    semesterId: id(1),
    name: ' Malla antigua ',
    code: null,
    section: '',
  });
  assert.equal(b.subjects[0].name, 'Malla antigua');
  assert.equal(b.subjects[0].section, null);
  assert.equal(removeSubject(b, id(3)).subjects.length, 0);
  assert.equal(b.subjects.length, 1);
});
test('contratos rechazan referencias ajenas, claves desconocidas y fechas inválidas', () => {
  const a = putSemester(emptySchedule(), semester(1));
  assert.throws(() =>
    putSubject(a, { id: id(3), semesterId: id(99), name: 'Ramo', code: null, section: null })
  );
  assert.throws(() => parseSchedule({ ...a, userId: id(99) }));
  assert.throws(() => putSemester(a, { ...semester(2), startsOn: '2026-02-30' }));
  assert.throws(() => putSemester(a, { ...semester(2), startsOn: '0000-01-01' }));
  assert.throws(() => parseSchedule({ ...a, semesters: [...a.semesters, ...a.semesters] }));
  assert.throws(() => putSemester(a, { ...semester(2), name: '\nRamo' }));
});
