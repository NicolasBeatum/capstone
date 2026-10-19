import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyPlanner, PlannerStore } from '../src/shared/planner/application/plannerStore.ts';
import { PlannerService, plannerStatus } from '../src/shared/planner/application/plannerService.ts';
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
  let local = emptyPlanner(),
    remote = { revision: 0, document: emptySchedule() },
    valid = true,
    seq = 20;
  const receipts = new Map();
  const store = new PlannerStore({
    read: async () => structuredClone(local),
    update: async (f) => {
      local = f(structuredClone(local));
      return structuredClone(local);
    },
    remove: async () => {},
  });
  const session = { userId: id(1), generation: 1 },
    gateway = {
      load: async () => structuredClone(remote),
      save: async (_, req) => {
        if (receipts.has(req.requestId)) return receipts.get(req.requestId);
        if (req.expectedRevision !== remote.revision) {
          return { status: 'conflict', remote: structuredClone(remote) };
        }
        remote = {
          revision: remote.revision + 1,
          document: structuredClone(req.document),
        };
        const receipt = {
          status: 'applied',
          revision: remote.revision,
          requestId: req.requestId,
        };
        receipts.set(req.requestId, receipt);
        return receipt;
      },
    };
  const service = new PlannerService({
    session: {
      current: async () => valid ? session : null,
      isCurrent: async () => valid,
      subscribe: () => () => {},
    },
    remote: gateway,
    store: async () => store,
    newId: () => id(seq++),
    legacy: {
      list: async () => {
        throw Error('No debe cargar datos heredados');
      },
    },
  });
  return {
    service,
    session,
    store,
    gateway,
    get remote() {
      return remote;
    },
    set remote(v) {
      remote = v;
    },
    set valid(v) {
      valid = v;
    },
  };
}
test('timeout después del commit deja petición duradera y el reintento no duplica', async () => {
  const f = setup();
  await f.service.editSchedule(
    f.session,
    emptySchedule(),
    (d) => putSemester(d, sem(2)),
  );
  const save = f.gateway.save;
  let fail = true;
  f.gateway.save = async (...args) => {
    const result = await save(...args);
    if (fail) {
      fail = false;
      throw Error('Timeout');
    }
    return result;
  };
  await assert.rejects(() => f.service.sync(f.session));
  const pending = (await f.store.read()).inFlight;
  assert(pending);
  assert.equal(f.remote.revision, 1);
  await f.service.sync(f.session);
  assert.equal(f.remote.revision, 1);
  assert.equal(plannerStatus(await f.store.read()), 'synced');
});
test('edición durante envío se conserva como pendiente y nunca se marca sincronizada', async () => {
  const f = setup();
  await f.service.editSchedule(
    f.session,
    emptySchedule(),
    (d) => putSemester(d, sem(2)),
  );
  const save = f.gateway.save;
  let release;
  const gate = new Promise((r) => release = r);
  let entered;
  const started = new Promise((r) => entered = r);
  f.gateway.save = async (...args) => {
    entered();
    await gate;
    return save(...args);
  };
  const work = f.service.sync(f.session);
  await started;
  const current = (await f.store.read()).working;
  await f.service.editSchedule(
    f.session,
    current,
    (d) => putSemester(d, sem(3)),
  );
  release();
  await work;
  const doc = await f.store.read();
  assert.equal(doc.working.semesters.length, 2);
  assert.equal(doc.base.document.semesters.length, 1);
  assert.equal(plannerStatus(doc), 'pending');
});
test('conflicto preserva ambas versiones y actividades; resolver retiene semestres remotos', async () => {
  const f = setup();
  await f.service.editSchedule(
    f.session,
    emptySchedule(),
    (d) => putSemester(d, sem(2)),
  );
  f.remote = { revision: 1, document: putSemester(emptySchedule(), sem(3)) };
  await f.service.sync(f.session);
  let doc = await f.store.read();
  assert(doc.conflict);
  assert.equal(doc.working.semesters[0].id, id(2));
  await f.service.resolve(f.session, doc.working, 1, 'local');
  doc = await f.store.read();
  assert.equal(doc.working.semesters.length, 2);
  await f.service.sync(f.session);
  assert.equal(f.remote.revision, 2);
});
test('respuesta tardía de otra sesión no sustituye la copia; recuperación nunca es automática', async () => {
  const f = setup();
  let release;
  f.gateway.load = async () => {
    await new Promise((r) => release = r);
    return { revision: 1, document: putSemester(emptySchedule(), sem(2)) };
  };
  const work = f.service.sync(f.session);
  await new Promise((r) => setTimeout(r, 0));
  f.valid = false;
  release();
  await assert.rejects(() => work);
  assert.equal((await f.store.read()).working.semesters.length, 0);
});
test('borrado durante una descarga bloquea el resultado y no recrea el almacén', async () => {
  const f = setup();
  let release;
  f.gateway.load = async () => {
    await new Promise((r) => release = r);
    return { revision: 1, document: putSemester(emptySchedule(), sem(2)) };
  };
  const work = f.service.sync(f.session);
  await new Promise((r) => setTimeout(r, 0));
  f.valid = false;
  await f.store.destroy();
  release();
  await assert.rejects(() => work);
  await assert.rejects(() => f.store.read());
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
    const current = (await f.store.read()).working;
    await f.service.editSchedule(
      f.session,
      current,
      (d) => activateSemester(d, semesterId),
    );
    await f.service.sync(f.session);
    assert.deepEqual((await f.store.read()).activities, saved);
    assert.equal(f.remote.document.activeSemesterId, semesterId);
  }
  await f.service.editSchedule(
    f.session,
    (await f.store.read()).working,
    (d) => putSubject(d, { ...d.subjects[0], name: 'Programación avanzada' }),
  );
  await f.service.sync(f.session);
  assert.deepEqual((await f.store.read()).activities, saved);
});
