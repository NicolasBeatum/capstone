import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareClassRegistration } from '../src/shared/planner/domain/classRegistration.ts';
import { emptySchedule } from '../src/shared/planner/domain/schedule.ts';
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const semester = { id: id(1), name: 'Mi semestre', startsOn: null, endsOn: null };
const subject = { id: id(2), semesterId: id(1), name: 'Ramo manual', code: null, section: null };
const block = (n, weekday = 1, endsAt = '10:00', room = '301') => ({
  id: id(n),
  subjectId: id(2),
  weekday,
  startsAt: '08:30',
  endsAt,
  room,
  teacher: null,
});
test('registro directo crea el primer horario y varios bloques con salas independientes', () => {
  const base = emptySchedule(),
    result = prepareClassRegistration(base, semester, subject, [
      block(3),
      block(4, 3, '12:30', '402'),
    ]);
  assert.equal(result.document.activeSemesterId, id(1));
  assert.equal(result.document.blocks.length, 2);
  assert.equal(result.document.blocks[1].room, '402');
  assert.deepEqual(result.overlaps, []);
  assert.deepEqual(base, emptySchedule());
});
test('ampliar un ramo conserva bloques anteriores y detecta cada cruce una sola vez', () => {
  const base = prepareClassRegistration(emptySchedule(), semester, subject, [block(3)]).document;
  const result = prepareClassRegistration(base, null, subject, [
    block(4, 1, '09:30'),
    block(5, 1, '11:00'),
  ]);
  assert.equal(result.document.subjects.length, 1);
  assert.equal(result.document.blocks.length, 3);
  assert.equal(result.overlaps.length, 3);
  assert.equal(base.blocks.length, 1);
});
test('un bloque inválido o duplicado no deja ramos o semestres creados parcialmente', () => {
  const base = emptySchedule();
  assert.throws(() => prepareClassRegistration(base, semester, subject, []));
  assert.throws(() => prepareClassRegistration(base, semester, subject, [block(3), block(4)]));
  assert.throws(() =>
    prepareClassRegistration(base, semester, subject, [block(3), block(4, 3, '07:00')])
  );
  assert.deepEqual(base, emptySchedule());
});
