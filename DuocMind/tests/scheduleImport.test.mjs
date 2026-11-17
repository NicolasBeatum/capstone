import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyPlanner } from '../src/shared/planner/application/plannerStore.ts';
import { putSemester, putSubject } from '../src/shared/planner/domain/schedule.ts';
import { putBlock } from '../src/shared/planner/domain/weeklySchedule.ts';
import { parseDuocTimetable } from '../src/features/agenda/domain/duocTimetable.ts';
import {
  blockKey,
  buildImport,
  findSameSemester,
  nextFreeSemesterName,
  sessionKey,
  sessionTitle,
} from '../src/features/agenda/application/scheduleImport.ts';
import { sampleTimetable } from './fixtures/duocTimetable.mjs';

const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
function ids(start = 100) {
  let n = start;
  return () => id(n++);
}
const parsed = parseDuocTimetable(sampleTimetable());
const selection = (overrides = {}) => ({
  semesterName: parsed.semesterName,
  subjectNames: {},
  excluded: new Set(),
  ...overrides,
});
const manual = {
  id: id(50),
  kind: 'exam',
  date: '2025-09-01',
  time: '10:00',
  title: 'Prueba manual',
  subjectName: null,
  semesterId: id(1),
  semesterName: '2.º semestre 2025',
  version: 1,
};
function withSemester() {
  let schedule = putSemester(emptyPlanner().schedule, {
    id: id(1), name: '2.º Semestre 2025 ', startsOn: null, endsOn: null,
  });
  schedule = putSubject(schedule, { id: id(2), semesterId: id(1), name: 'Ramo viejo', code: null, section: null });
  schedule = putBlock(schedule, {
    id: id(3), subjectId: id(2), weekday: 1, startsAt: '08:00', endsAt: '09:00', room: null, teacher: null,
  });
  return { ...emptyPlanner(), schedule, activities: [manual] };
}

test('crea el semestre activo con ramos, bloques y actividades puntuales', () => {
  const doc = buildImport(parsed, selection(), { kind: 'new' }, ids())(emptyPlanner());
  const { schedule, activities } = doc;
  assert.equal(schedule.semesters.length, 1);
  assert.equal(schedule.semesters[0].name, '2.º semestre 2025');
  assert.equal(schedule.activeSemesterId, schedule.semesters[0].id);
  assert.equal(schedule.subjects.length, 5);
  assert.equal(schedule.blocks.length, parsed.blocks.length);
  const seguridad = schedule.subjects.find((s) => s.code === 'ASY6131');
  assert.deepEqual([seguridad.name, seguridad.section], ['Seguridad en Sistemas Computacionales', '004D']);
  assert.equal(schedule.blocks.filter((b) => b.subjectId === seguridad.id).length, 2);
  // El ramo puntual existe, pero sin bloques semanales.
  const portafolio = schedule.subjects.find((s) => s.code === 'APY6461');
  assert.ok(!schedule.blocks.some((b) => b.subjectId === portafolio.id));
  assert.deepEqual(activities.map((a) => [a.date, a.time, a.endTime, a.title, a.kind]), [
    ['2025-08-25', '16:01', '17:20', 'Proceso de Portafolio 6 · Sala VIRTUAL01', 'personal'],
    ['2025-09-22', '16:01', '17:20', 'Proceso de Portafolio 6 · Sala VIRTUAL01', 'personal'],
  ]);
  assert.ok(activities.every((a) =>
    a.semesterId === schedule.semesters[0].id && a.subjectName === 'Proceso de Portafolio 6'
  ));
});

test('respeta nombres editados y elementos quitados', () => {
  const ml = parsed.blocks.findIndex((b) => b.subjectKey === 'MLY0100-001D');
  const doc = buildImport(parsed, selection({
    semesterName: 'Mi semestre',
    subjectNames: { 'ASY6131-004D': 'Seguridad' },
    excluded: new Set(['TAL1234-001D', blockKey(ml), sessionKey(1)]),
  }), { kind: 'new' }, ids())(emptyPlanner());
  assert.equal(doc.schedule.semesters[0].name, 'Mi semestre');
  assert.ok(doc.schedule.subjects.some((s) => s.name === 'Seguridad'));
  assert.ok(!doc.schedule.subjects.some((s) => s.code === 'TAL1234'));
  assert.equal(doc.schedule.blocks.length, parsed.blocks.length - 2);
  assert.deepEqual(doc.activities.map((a) => a.date), ['2025-08-25']);
});

test('quitar todas las clases no guarda nada', () => {
  const excluded = new Set(parsed.subjects.map((s) => s.key));
  assert.throws(
    () => buildImport(parsed, selection({ excluded }), { kind: 'new' }, ids())(emptyPlanner()),
    /al menos una clase/,
  );
});

test('detecta el semestre repetido y propone el siguiente nombre libre', () => {
  const doc = withSemester();
  assert.equal(findSameSemester(doc.schedule, '2.º semestre 2025')?.id, id(1));
  assert.equal(findSameSemester(doc.schedule, '1.er semestre 2025'), null);
  assert.equal(nextFreeSemesterName(doc.schedule, '2.º semestre 2025'), '2.º semestre 2025 (2)');
  const twice = buildImport(parsed, selection(), { kind: 'new' }, ids())(doc);
  assert.equal(nextFreeSemesterName(twice.schedule, '2.º semestre 2025'), '2.º semestre 2025 (3)');
});

test('crear otro conserva el semestre existente', () => {
  const doc = buildImport(parsed, selection(), { kind: 'new' }, ids())(withSemester());
  assert.deepEqual(doc.schedule.semesters.map((s) => s.name).sort(), [
    '2.º Semestre 2025', '2.º semestre 2025 (2)',
  ]);
  assert.ok(doc.schedule.subjects.some((s) => s.id === id(2)));
  assert.notEqual(doc.schedule.activeSemesterId, id(1));
});

test('reemplazar cambia ramos y bloques, pero conserva las actividades manuales', () => {
  const doc = buildImport(parsed, selection(), { kind: 'replace', semesterId: id(1) }, ids())(withSemester());
  assert.deepEqual(doc.schedule.semesters.map((s) => s.id), [id(1)]);
  assert.equal(doc.schedule.activeSemesterId, id(1));
  assert.ok(!doc.schedule.subjects.some((s) => s.id === id(2)));
  assert.ok(!doc.schedule.blocks.some((b) => b.id === id(3)));
  assert.equal(doc.schedule.subjects.length, 5);
  assert.ok(doc.activities.some((a) => a.id === manual.id));
  assert.equal(doc.activities.length, 3);
});

test('datos inválidos no producen cambios', () => {
  const broken = { ...parsed, blocks: [{ ...parsed.blocks[0], room: 'x'.repeat(200) }] };
  assert.throws(() => buildImport(broken, selection(), { kind: 'new' }, ids())(emptyPlanner()));
  assert.throws(() =>
    buildImport(parsed, selection(), { kind: 'replace', semesterId: id(9) }, ids())(emptyPlanner())
  );
});

test('el título de la actividad incluye la sala y no supera 120 caracteres', () => {
  assert.equal(sessionTitle('Portafolio', 'Y307'), 'Portafolio · Sala Y307');
  assert.equal(sessionTitle('Portafolio', ''), 'Portafolio');
  assert.equal(sessionTitle('x'.repeat(130), 'Y307').length, 120);
});
