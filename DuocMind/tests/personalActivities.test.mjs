import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyPlanner,
  parsePlanner,
  parsePlannerJson,
} from '../src/shared/planner/application/plannerStore.ts';
import {
  personalActivityEnd,
  personalActivityState,
} from '../src/shared/planner/domain/personalActivityTime.ts';
import {
  savePersonalActivity,
  transferActivities,
} from '../src/shared/planner/application/personalActivities.ts';
import { putSemester } from '../src/shared/planner/domain/schedule.ts';
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const activity = {
  id: id(1),
  kind: 'exam',
  date: '2026-10-19',
  time: '08:30',
  title: 'Prueba local',
  subjectName: 'Ramo',
  semesterId: null,
  semesterName: null,
  version: 1,
};
function setup() {
  const d = emptyPlanner();
  d.working = putSemester(d.working, { id: id(2), name: 'Semestre', startsOn: null, endsOn: null });
  return savePersonalActivity(d, activity);
}
const transfer = (mode) => ({
  requestId: id(3),
  mode,
  targetSemesterId: id(2),
  sources: [{ id: id(1), version: 1, copyId: id(4), date: '2026-10-19' }],
});
test('copia conserva original, fecha y ramo; reintento no duplica', () => {
  const doc = setup(), req = transfer('copy'), next = transferActivities(doc, req);
  assert.equal(next.activities.length, 2);
  assert.deepEqual(next.activities[0], activity);
  assert.equal(next.activities[1].id, id(4));
  assert.equal(next.activities[1].date, activity.date);
  assert.equal(transferActivities(next, req).activities.length, 2);
  assert.equal(doc.activities.length, 1);
});
test('mover conserva identidad, valida lote entero y cambia fecha solo explícitamente', () => {
  const doc = setup(), req = transfer('move');
  const next = transferActivities(doc, req);
  assert.equal(next.activities[0].id, id(1));
  assert.equal(next.activities[0].date, activity.date);
  assert.equal(next.activities[0].version, 2);
  assert.throws(() =>
    transferActivities(doc, {
      ...req,
      sources: [...req.sources, { id: id(99), version: 1, copyId: null, date: activity.date }],
    })
  );
  assert.equal(doc.activities[0].semesterId, null);
  assert.equal(
    transferActivities(doc, {
      ...req,
      sources: req.sources.map((s) => ({ ...s, date: '2026-11-03' })),
    }).activities[0].date,
    '2026-11-03',
  );
  assert.throws(() => savePersonalActivity(next, activity));
});
test('intervalo variable persiste tras reabrir y se conserva al copiar y mover', () => {
  const saved = savePersonalActivity(setup(), { ...activity, endTime: '11:45' });
  const reopened = parsePlanner(parsePlannerJson(JSON.stringify(saved)));
  assert.equal(reopened.activities[0].endTime, '11:45');
  const req = { ...transfer('copy'), sources: [{ ...transfer('copy').sources[0], version: 2 }] };
  const copied = transferActivities(reopened, req);
  assert.equal(copied.activities[1].time, '08:30');
  assert.equal(copied.activities[1].endTime, '11:45');
  const moved = transferActivities(reopened, { ...req, mode: 'move' });
  assert.equal(moved.activities[0].endTime, '11:45');
});
test('intervalos vacíos, invertidos o con hora inválida se rechazan sin perder el original', () => {
  const doc = setup();
  for (const endTime of ['08:30', '08:29', '00:15', '24:00', '', null]) {
    assert.throws(() => savePersonalActivity(doc, { ...activity, endTime }));
    assert.deepEqual(doc.activities[0], activity);
  }
});
test('estado usa inicio inclusivo y término exclusivo de la duración configurada', () => {
  const value = { ...activity, endTime: '11:45' };
  assert.equal(personalActivityState(value, new Date('2026-10-19T11:29:00Z')), 'upcoming');
  assert.equal(personalActivityState(value, new Date('2026-10-19T11:30:00Z')), 'in-progress');
  assert.equal(personalActivityState(value, new Date('2026-10-19T14:44:00Z')), 'in-progress');
  assert.equal(personalActivityState(value, new Date('2026-10-19T14:45:00Z')), 'ended');
  assert.equal(personalActivityEnd(value.time, value.endTime), '11:45');
});
test('datos anteriores conservan una hora sin reescritura, incluso al cruzar medianoche', () => {
  const old = { ...activity, time: '23:30' };
  const doc = savePersonalActivity(emptyPlanner(), old);
  assert.deepEqual(parsePlanner(JSON.parse(JSON.stringify(doc))).activities[0], old);
  assert.equal(personalActivityEnd(old.time), '00:30');
  assert.equal(personalActivityState(old, new Date('2026-10-20T03:29:00Z')), 'in-progress');
  assert.equal(personalActivityState(old, new Date('2026-10-20T03:30:00Z')), 'ended');
});
