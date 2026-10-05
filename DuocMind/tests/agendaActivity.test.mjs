import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAgendaActivityEndTime,
  getAgendaActivityStatus,
  getVisibleAgendaActivities,
} from '../src/features/agenda/domain/agendaActivity.ts';

const day = '2026-10-05';

function activity(id, time, date = day) {
  return { id, date, title: id, subject: null, time };
}

test('calcula el término del bloque una hora después, incluidos minutos y cambio de día', () => {
  assert.equal(getAgendaActivityEndTime('09:30'), '10:30');
  assert.equal(getAgendaActivityEndTime('22:30'), '23:30');
});

test('clasifica bloques futuros, en curso y finalizados usando bloques de una hora', () => {
  const now = new Date(2026, 9, 5, 9, 30);

  assert.equal(getAgendaActivityStatus(activity('future', '10:00'), now), 'upcoming');
  assert.equal(getAgendaActivityStatus(activity('active', '09:00'), now), 'in-progress');
  assert.equal(getAgendaActivityStatus(activity('ended', '08:00'), now), 'ended');
  assert.equal(
    getAgendaActivityStatus(activity('boundary', '08:30'), new Date(2026, 9, 5, 9, 0)),
    'in-progress',
  );
  assert.equal(
    getAgendaActivityStatus(activity('finished-boundary', '08:00'), new Date(2026, 9, 5, 9, 0, 1)),
    'ended',
  );
});

test('muestra solamente las actividades pendientes del día en orden cronológico', () => {
  const now = new Date(2026, 9, 5, 9, 30);
  const activities = [
    activity('future-later', '11:00'),
    activity('other-day', '10:00', '2026-10-06'),
    activity('ended', '08:00'),
    activity('active', '09:00'),
    activity('future-soon', '10:00'),
  ];

  assert.deepEqual(
    getVisibleAgendaActivities(activities, day, now).map(({ id }) => id),
    ['active', 'future-soon', 'future-later'],
  );
});
