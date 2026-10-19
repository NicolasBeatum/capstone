import test from 'node:test';
import assert from 'node:assert/strict';
import { createScheduleGateway } from '../src/shared/planner/infrastructure/scheduleGateway.ts';
import { emptySchedule } from '../src/shared/planner/domain/schedule.ts';
const id = '00000000-0000-4000-8000-000000000001', session = { userId: id, generation: 1 };
test('serializa únicamente horario y valida recibos', async () => {
  const calls = [];
  const gateway = createScheduleGateway(async (name, args) => {
    calls.push(args);
    return { data: { status: 'applied', revision: 1, requestId: id }, error: null };
  });
  await gateway.save(session, {
    requestId: id,
    expectedRevision: 0,
    document: emptySchedule(),
    activities: [{ title: 'Privado' }],
  });
  assert.deepEqual(Object.keys(calls[0]).sort(), [
    'p_document',
    'p_expected_revision',
    'p_request_id',
  ]);
  assert(!JSON.stringify(calls).includes('Privado'));
  await assert.rejects(() =>
    gateway.save(session, {
      requestId: id,
      expectedRevision: 0,
      document: { ...emptySchedule(), activities: [] },
    })
  );
});
test('rechaza respuesta inválida y comunica migración ausente sin filtrar servidor', async () => {
  await assert.rejects(() =>
    createScheduleGateway(async () => ({
      data: { revision: -1, document: emptySchedule() },
      error: null,
    })).load(session)
  );
  await assert.rejects(
    () =>
      createScheduleGateway(async () => ({
        data: null,
        error: { code: 'PGRST202', message: 'secreto' },
      })).load(session),
    /actualización de horarios/,
  );
});
