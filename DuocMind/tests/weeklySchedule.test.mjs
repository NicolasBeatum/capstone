import test from 'node:test';
import assert from 'node:assert/strict';
import { emptySchedule, putSemester, putSubject } from '../src/shared/planner/domain/schedule.ts';
import {
  civilNow,
  classesOnDate,
  findBlockOverlaps,
  putBlock,
  semesterWeek,
  addMonths,
  monthGrid,
} from '../src/shared/planner/domain/weeklySchedule.ts';
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
function setup() {
  return putSubject(
    putSemester(emptySchedule(), { id: id(1), name: 'Uno', startsOn: null, endsOn: null }),
    { id: id(2), semesterId: id(1), name: 'Ramo', code: null, section: null },
  );
}
const block = (n, day = 1) => ({
  id: id(n),
  subjectId: id(2),
  weekday: day,
  startsAt: '08:30',
  endsAt: '10:00',
  room: '301',
  teacher: null,
});
test('salas por bloque sobreviven a serialización y editar una no afecta la otra', () => {
  let doc = putBlock(setup(), block(3));
  doc = putBlock(doc, { ...block(4, 3), room: 'Laboratorio 402' });
  doc = putBlock(JSON.parse(JSON.stringify(doc)), { ...block(3), room: '302' });
  assert.equal(
    classesOnDate(doc, '2026-10-19', new Date('2026-10-19T11:30:00Z'))[0].block.room,
    '302',
  );
  assert.equal(
    classesOnDate(doc, '2026-10-21', new Date('2026-10-19T11:30:00Z'))[0].block.room,
    'Laboratorio 402',
  );
});
test('cruces requieren confirmación; consecutivos válidos; duplicados se rechazan', () => {
  const doc = putBlock(setup(), block(3));
  assert.throws(() => putBlock(doc, { ...block(4), startsAt: '09:00' }));
  assert.equal(putBlock(doc, { ...block(4), startsAt: '09:00' }, true).blocks.length, 2);
  assert.equal(
    findBlockOverlaps(doc, { ...block(4), startsAt: '10:00', endsAt: '11:00' }).length,
    0,
  );
  assert.throws(() => putBlock(doc, block(4), true));
  assert.throws(() => putBlock(doc, { ...block(4), endsAt: '08:30' }));
});
test('inicio inclusivo, fin exclusivo, vigencia y hora Santiago independiente de TZ', () => {
  const doc = putBlock(setup(), block(3));
  assert.equal(
    classesOnDate(doc, '2026-10-19', new Date('2026-10-19T11:30:00Z'))[0].state,
    'in-progress',
  );
  assert.equal(
    classesOnDate(doc, '2026-10-19', new Date('2026-10-19T13:00:00Z'))[0].state,
    'ended',
  );
  assert.equal(
    classesOnDate(
      { ...doc, semesters: doc.semesters.map((s) => ({ ...s, endsOn: '2026-10-18' })) },
      '2026-10-19',
      new Date(),
    ).length,
    0,
  );
  assert.equal(civilNow(new Date('2026-07-01T12:30:00Z')).minutes, 510);
  assert.equal(civilNow(new Date('2026-10-01T11:30:00Z')).minutes, 510);
});
test('la semana agrupa por día, ordena por hora y excluye otros semestres', () => {
  const block = (n, subjectId, weekday, startsAt, endsAt) => ({
    id: id(n),
    subjectId,
    weekday,
    startsAt,
    endsAt,
    room: null,
    teacher: null,
  });
  let doc = putSemester(
    putSemester(emptySchedule(), { id: id(1), name: 'Uno', startsOn: null, endsOn: null }),
    { id: id(2), name: 'Dos', startsOn: null, endsOn: null },
  );
  for (const [n, semesterId, name] of [[3, id(1), 'Base'], [4, id(2), 'Otro']]) {
    doc = putSubject(doc, { id: id(n), semesterId, name, code: null, section: null });
  }
  doc = putBlock(doc, block(5, id(3), 5, '11:00', '12:30'));
  doc = putBlock(doc, block(6, id(3), 5, '08:30', '10:00'));
  doc = putBlock(doc, block(7, id(3), 1, '09:00', '10:00'));
  doc = putBlock(doc, block(8, id(4), 2, '09:00', '10:00'));
  const week = semesterWeek(doc, id(1));
  assert.deepEqual(week.map((day) => day.weekday), [1, 5]);
  assert.deepEqual(week[1].classes.map((c) => c.block.id), [id(6), id(5)]);
  assert.deepEqual(semesterWeek(doc, id(9)), []);
});
test('el calendario arma semanas de lunes a domingo y mueve meses sin desbordar', () => {
  const november = monthGrid('2026-11-15');
  assert.equal(november[0][6], '2026-11-01');
  assert.equal(november[0][0], null);
  assert.equal(november.flat().filter(Boolean).length, 30);
  assert(november.every((week) => week.length === 7));
  assert.equal(monthGrid('2028-02-10').flat().filter(Boolean).length, 29);
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonths('2026-12-15', 1), '2027-01-15');
  assert.equal(addMonths('2026-01-15', -1), '2025-12-15');
});
