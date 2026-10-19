import assert from 'node:assert/strict';
import test from 'node:test';
import {
  deleteAgendaActivity,
  getAgendaActivities,
  saveAgendaActivity,
} from '../src/features/agenda/infrastructure/agendaStorage.web.ts';

const STORAGE_KEY = 'duocmind.agenda.activities.v1';

function installStorage(initialValue = null) {
  const values = new Map(initialValue === null ? [] : [[STORAGE_KEY, initialValue]]);
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: (key) => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
      },
    },
  });
  return values;
}

test('la agenda web guarda, recupera y elimina actividades', async () => {
  const values = installStorage();
  const activity = {
    id: 'activity-1',
    date: '2026-10-04',
    title: 'Repasar para la prueba',
    subject: 'Programación Web',
    time: '09:30',
  };

  await saveAgendaActivity(activity);
  assert.deepEqual(await getAgendaActivities(), [activity]);

  const withoutSubject = { ...activity, id: 'activity-2', subject: null };
  await saveAgendaActivity(withoutSubject);
  assert.deepEqual(await getAgendaActivities(), [activity, withoutSubject]);

  await deleteAgendaActivity(activity.id);
  assert.deepEqual(await getAgendaActivities(), [withoutSubject]);

  await deleteAgendaActivity(withoutSubject.id);
  assert.deepEqual(await getAgendaActivities(), []);
  assert.equal(values.get(STORAGE_KEY), '[]');
});

test('la agenda web informa si los datos locales están malformados', async () => {
  installStorage('{"not":"an array"}');
  await assert.rejects(getAgendaActivities(), /No se pudieron leer las actividades guardadas/);

  installStorage(JSON.stringify([{ id: 'incomplete' }]));
  await assert.rejects(getAgendaActivities(), /No se pudieron leer las actividades guardadas/);
});
