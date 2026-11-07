import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyPlanner, PlannerStore } from '../src/shared/planner/application/plannerStore.ts';
import { PlannerService } from '../src/shared/planner/application/plannerService.ts';
import {
  activateSemester,
  emptySchedule,
  putSemester,
  putSubject,
} from '../src/shared/planner/domain/schedule.ts';
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const sem = (n) => ({
  id: id(n),
  name: `Semestre ${n}`,
  startsOn: null,
  endsOn: null,
});
function setup() {
  let local = emptyPlanner(), valid = true;
  const erased = [];
  const store = new PlannerStore({
    read: async () => structuredClone(local),
    update: async (f) => {
      local = f(structuredClone(local));
      return structuredClone(local);
    },
    remove: async () => {},
  });
  const session = { userId: id(1), generation: 1 },
    account = {
      lookup: async () => null,
      erase: async (userId) => {
        erased.push(userId);
      },
    };
  const service = new PlannerService({
    session: {
      current: async () => valid ? session : null,
      isCurrent: async () => valid,
      subscribe: () => () => {},
    },
    account,
    store: async () => store,
  });
  return {
    service,
    session,
    store,
    account,
    erased,
    set valid(v) {
      valid = v;
    },
  };
}
test('guarda el horario solo en el almacén local y lo conserva al releer', async () => {
  const f = setup();
  await f.service.editSchedule(f.session, emptySchedule(), (d) => putSemester(d, sem(2)));
  const { document } = await f.service.snapshot(f.session);
  assert.equal(document.schedule.semesters[0].id, id(2));
  assert.equal(document.schedule.activeSemesterId, id(2));
  assert.deepEqual(Object.keys(document).sort(), [
    'activities',
    'receipts',
    'schedule',
    'schema',
  ]);
});
test('una edición sobre una versión vieja o que quita semestres no cambia el horario', async () => {
  const f = setup();
  await f.service.editSchedule(f.session, emptySchedule(), (d) => putSemester(d, sem(2)));
  const saved = (await f.store.read()).schedule;
  await assert.rejects(() =>
    f.service.editSchedule(f.session, emptySchedule(), (d) => putSemester(d, sem(3)))
  );
  await assert.rejects(() => f.service.editSchedule(f.session, saved, () => emptySchedule()));
  assert.deepEqual((await f.store.read()).schedule, saved);
});
test('una sesión que cambió no guarda cambios', async () => {
  const f = setup();
  f.valid = false;
  await assert.rejects(() =>
    f.service.editSchedule(f.session, emptySchedule(), (d) => putSemester(d, sem(2)))
  );
  assert.equal((await f.store.read()).schedule.semesters.length, 0);
});
test('alternar el horario activo y editar sus ramos conserva todas las actividades locales', async () => {
  const f = setup();
  await f.service.editSchedule(
    f.session,
    emptySchedule(),
    (d) =>
      putSubject(putSemester(putSemester(d, sem(2)), sem(3)), {
        id: id(4),
        semesterId: id(2),
        name: 'Programación',
        code: null,
        section: null,
      }),
  );
  for (const [index, kind] of ['personal', 'exam', 'task'].entries()) {
    await f.service.saveActivity(f.session, {
      id: id(30 + index),
      kind,
      title: `Actividad ${kind}`,
      date: '2026-10-19',
      time: '09:00',
      subjectName: 'Programación',
      version: 1,
      semesterId: kind === 'personal' ? null : id(2),
      semesterName: kind === 'personal' ? null : 'Semestre 2',
    });
  }
  const saved = (await f.store.read()).activities;
  for (const semesterId of [id(3), id(2)]) {
    const current = (await f.store.read()).schedule;
    await f.service.editSchedule(f.session, current, (d) => activateSemester(d, semesterId));
    const after = await f.store.read();
    assert.deepEqual(after.activities, saved);
    assert.equal(after.schedule.activeSemesterId, semesterId);
  }
  await f.service.editSchedule(
    f.session,
    (await f.store.read()).schedule,
    (d) => putSubject(d, { ...d.subjects[0], name: 'Programación avanzada' }),
  );
  assert.deepEqual((await f.store.read()).activities, saved);
});
test('una cuenta eliminada limpia el dispositivo', async () => {
  const f = setup();
  f.account.lookup = async () => ({ code: 'user_not_found' });
  await f.service.verifyAccount(f.session);
  assert.deepEqual(f.erased, [id(1)]);
});
test('un fallo de red, otro error o no tener sesión no borran datos', async () => {
  const f = setup();
  for (
    const lookup of [
      async () => {
        throw Error('Sin red');
      },
      async () => ({ code: 'unexpected_failure' }),
      async () => null,
    ]
  ) {
    f.account.lookup = lookup;
    await f.service.verifyAccount(f.session);
  }
  assert.deepEqual(f.erased, []);
});
test('una sesión que cambia durante la consulta no borra datos', async () => {
  const f = setup();
  f.account.lookup = async () => {
    f.valid = false;
    return { code: 'user_not_found' };
  };
  await f.service.verifyAccount(f.session);
  assert.deepEqual(f.erased, []);
  let consulted = false;
  f.account.lookup = async () => {
    consulted = true;
    return null;
  };
  await f.service.verifyAccount(f.session);
  assert.equal(consulted, false);
});
