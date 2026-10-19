import test from 'node:test';
import assert from 'node:assert/strict';
import { projectPlannerDashboard } from '../src/shared/planner/application/plannerProjection.ts';
import { emptySchedule, putSemester, putSubject } from '../src/shared/planner/domain/schedule.ts';
import { putBlock } from '../src/shared/planner/domain/weeklySchedule.ts';
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
function schedule() {
  let d = putSubject(
    putSemester(emptySchedule(), { id: id(1), name: 'Semestre', startsOn: null, endsOn: null }),
    { id: id(2), semesterId: id(1), name: 'Ramo', code: null, section: null },
  );
  d = putBlock(d, {
    id: id(3),
    subjectId: id(2),
    weekday: 1,
    startsAt: '08:30',
    endsAt: '10:00',
    room: 'Sala 301',
    teacher: null,
  });
  return d;
}
test('inicio usa clases reales, estado vacío y límites exactos de horario', () => {
  const d = schedule(), start = projectPlannerDashboard(d, [], new Date('2026-10-19T11:30:00Z'));
  assert.equal(start.current.length, 1);
  assert.equal(start.current[0].block.room, 'Sala 301');
  assert.equal(start.current[0].progress, 0);
  assert.equal(projectPlannerDashboard(d, [], new Date('2026-10-19T13:00:00Z')).current.length, 0);
  assert.equal(
    projectPlannerDashboard(emptySchedule(), [], new Date()).emptyLabel,
    'Configura tu horario',
  );
});
test('cruces muestran más de una clase y próximos pendientes solo vienen de datos locales', () => {
  const d = putBlock(schedule(), {
    id: id(4),
    subjectId: id(2),
    weekday: 1,
    startsAt: '09:00',
    endsAt: '11:00',
    room: 'Sala 402',
    teacher: null,
  }, true);
  const result = projectPlannerDashboard(d, [{
    id: id(5),
    kind: 'task',
    title: 'Tarea real',
    date: '2026-10-20',
    time: '12:00',
    subjectName: null,
  }], new Date('2026-10-19T12:30:00Z'));
  assert.equal(result.current.length, 2);
  assert.equal(result.upcoming[0].title, 'Tarea real');
  assert.equal(result.upcoming[0].when, 'Mañana');
  assert.equal(projectPlannerDashboard(d, [], new Date('2026-10-19T12:30:00Z')).upcoming.length, 0);
});
test('inicio conserva una actividad hasta su término configurado y muestra su intervalo', () => {
  const activity = {
    id: id(5),
    kind: 'personal',
    title: 'Estudiar',
    date: '2026-10-19',
    time: '08:30',
    endTime: '11:45',
    subjectName: null,
  };
  const before = projectPlannerDashboard(schedule(), [activity], new Date('2026-10-19T14:44:00Z'));
  assert.equal(before.upcoming[0].detail, '08:30–11:45');
  assert.equal(
    projectPlannerDashboard(schedule(), [activity], new Date('2026-10-19T14:45:00Z')).upcoming
      .length,
    0,
  );
});
