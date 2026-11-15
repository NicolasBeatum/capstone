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
  changeTimePart,
} from '../src/shared/planner/domain/personalActivityTime.ts';
import {
  savePersonalActivity,
  setActivityDone,
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
  d.schedule = putSemester(d.schedule, { id: id(2), name: 'Semestre', startsOn: null, endsOn: null });
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
test('la hora se edita por partes con cualquier minuto y rechaza valores inválidos', () => {
  assert.equal(changeTimePart('09:07', 'hour', '14'), '14:07');
  assert.equal(changeTimePart('09:07', 'hour', '0'), '00:07');
  assert.equal(changeTimePart('09:07', 'minute', '37'), '09:37');
  assert.equal(changeTimePart('09:07', 'minute', '5'), '09:05');
  for (const [part, text] of [['hour', '24'], ['minute', '60'], ['hour', ''], ['minute', 'a']]) {
    assert.equal(changeTimePart('09:07', part, text), null);
  }
});
const DONE = '2026-11-14T18:00:00.000Z';
test('marcar y desmarcar cambia doneAt, sube la versión y rechaza versiones viejas', () => {
  const doc = setup(), done = setActivityDone(doc, id(1), 1, DONE);
  assert.equal(done.activities[0].doneAt, DONE);
  assert.equal(done.activities[0].version, 2);
  assert.throws(() => setActivityDone(done, id(1), 1, null), /cambió/);
  assert.throws(() => setActivityDone(doc, id(1), 1, 'hoy'));
  const back = setActivityDone(done, id(1), 2, null);
  assert.equal('doneAt' in back.activities[0], false);
  assert.equal(back.activities[0].version, 3);
});
test('editar desde el formulario conserva el estado e ignora el doneAt recibido', () => {
  const done = setActivityDone(setup(), id(1), 1, DONE);
  const edited = savePersonalActivity(done, { ...activity, version: 2, title: 'Otra' });
  assert.equal(edited.activities[0].doneAt, DONE);
  assert.equal(edited.activities[0].title, 'Otra');
  const forged = savePersonalActivity(edited, {
    ...activity,
    version: 3,
    doneAt: '2020-01-01T00:00:00.000Z',
  });
  assert.equal(forged.activities[0].doneAt, DONE);
  const fresh = savePersonalActivity(emptyPlanner(), { ...activity, doneAt: DONE });
  assert.equal('doneAt' in fresh.activities[0], false);
});
test('copiar deja pendiente la copia; mover conserva el estado', () => {
  const done = setActivityDone(setup(), id(1), 1, DONE);
  const source = (mode) => ({
    ...transfer(mode),
    sources: [{ ...transfer(mode).sources[0], version: 2 }],
  });
  const copied = transferActivities(done, source('copy'));
  assert.equal(copied.activities[0].doneAt, DONE);
  assert.equal('doneAt' in copied.activities[1], false);
  assert.equal(transferActivities(done, source('move')).activities[0].doneAt, DONE);
});
