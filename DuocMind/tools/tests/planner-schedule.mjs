import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { authClient, database } from '../scripts/runtime.mjs';
const db = await database(),
  owners = [randomUUID(), randomUUID()],
  sem = randomUUID(),
  subject = randomUUID(),
  block = randomUUID();
const document = {
  schema: 1,
  activeSemesterId: sem,
  semesters: [{ id: sem, name: 'Semestre sintético', startsOn: null, endsOn: null }],
  subjects: [{ id: subject, semesterId: sem, name: 'Ramo manual', code: null, section: null }],
  blocks: [{
    id: block,
    subjectId: subject,
    weekday: 1,
    startsAt: '08:30',
    endsAt: '10:00',
    room: '301',
    teacher: null,
  }, {
    id: randomUUID(),
    subjectId: subject,
    weekday: 3,
    startsAt: '11:00',
    endsAt: '12:30',
    room: '402',
    teacher: null,
  }],
};
async function asOwner(client, owner) {
  await client.query('set local role authenticated');
  await client.query(
    "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
    [owner, JSON.stringify({ sub: owner, role: 'authenticated' })],
  );
}
async function call(client, revision, requestId, doc = document) {
  return (await client.query('select public.save_personal_schedule($1,$2,$3) result', [
    revision,
    requestId,
    doc,
  ])).rows[0].result;
}
try {
  for (const owner of owners) {
    await db.query('insert into auth.users(id,email) values($1,$2)', [
      owner,
      `planner-${owner}@example.test`,
    ]);
    await db.query(
      "insert into public.estudiante(auth_user_id,rut,primer_nombre,primer_apellido) values($1,$2,'Prueba','Horario')",
      [owner, `PLANNER-${owner}`],
    );
  }
  await db.query('begin');
  await asOwner(db, owners[0]);
  const request = randomUUID(), created = await call(db, 0, request);
  assert.equal(created.revision, 1);
  assert.deepEqual(await call(db, 0, request), created);
  await db.query('set constraints all immediate');
  const read = (await db.query('select public.load_personal_schedule() result')).rows[0].result;
  assert.equal(read.document.blocks.find((b) => b.id === block).room, '301');
  assert.equal(read.document.blocks.find((b) => b.id !== block).room, '402');
  const reject = async (fn, code) => {
    await db.query('savepoint negative');
    await assert.rejects(fn, (e) => e.code === code);
    await db.query('rollback to savepoint negative');
  };
  await reject(() => call(db, 0, request, { ...document, activeSemesterId: null }), 'P0422');
  await reject(
    () =>
      call(db, 0, request, {
        ...document,
        semesters: document.semesters.map((s) => ({ ...s, name: 'Otro' })),
      }),
    'P0409',
  );
  assert.equal((await call(db, 0, randomUUID())).status, 'conflict');
  for (
    const bad of [
      { ...document, userId: owners[1] },
      { ...document, blocks: document.blocks.map((b) => ({ ...b, subjectId: randomUUID() })) },
      { ...document, blocks: [document.blocks[0], { ...document.blocks[0], id: randomUUID() }] },
      { ...document, semesters: document.semesters.map((s) => ({ ...s, startsOn: '2026-02-30' })) },
    ]
  ) await reject(() => call(db, 1, randomUUID(), bad), 'P0422');
  await reject(() => db.query('update public.personal_schedule set revision=99'), '42501');
  await reject(() => db.query('select * from schedule_private.schedule_request'), '42501');
  await reject(() => db.query("select schedule_private.validate_document('{}')"), '42501');
  await asOwner(db, owners[1]);
  assert.equal((await db.query('select * from public.schedule_block')).rowCount, 0);
  assert.equal(
    (await db.query('select public.load_personal_schedule() result')).rows[0].result.revision,
    0,
  );
  await db.query('set local role anon');
  await reject(() => db.query('select public.load_personal_schedule()'), '42501');
  await db.query('rollback');
  const clients = await Promise.all([database(), database()]);
  try {
    const results = await Promise.all(clients.map(async (client) => {
      await client.query('begin');
      await asOwner(client, owners[0]);
      const result = await call(client, 0, randomUUID());
      await client.query('commit');
      return result;
    }));
    assert.deepEqual(results.map((r) => r.status).sort(), ['applied', 'conflict']);
    await clients[1].query('begin');
    await asOwner(clients[1], owners[0]);
    const recovered =
      (await clients[1].query('select public.load_personal_schedule() result')).rows[0].result;
    assert.equal(recovered.revision, 1);
    assert.equal(recovered.document.blocks.length, 2);
    await clients[1].query('commit');
  } finally {
    await Promise.all(clients.map((c) => c.end()));
  }
  await db.query('begin');
  await asOwner(db, owners[0]);
  const updated = {
    ...document,
    blocks: document.blocks.map((b) => ({ ...b, room: b.id === block ? '302' : b.room })),
  };
  const req = randomUUID();
  const applied = await call(db, 1, req, updated);
  assert.equal(applied.revision, 2);
  assert.equal(
    (await call(db, 2, randomUUID(), { ...updated, subjects: [], blocks: [] })).revision,
    3,
  );
  assert.deepEqual(await call(db, 1, req, updated), applied);
  await reject(
    () =>
      call(db, 3, randomUUID(), {
        schema: 1,
        activeSemesterId: null,
        semesters: [],
        subjects: [],
        blocks: [],
      }),
    'P0422',
  );
  await db.query('commit');
  // El contrato HTTP también respeta permisos y no depende de las claims de SQL.
  const anon = authClient();
  const unauthorized = await anon.rpc('load_personal_schedule');
  assert(unauthorized.error);
  await db.query('delete from auth.users where id=$1', [owners[0]]);
  assert.equal(
    (await db.query('select * from public.schedule_semester where user_id=$1', [owners[0]]))
      .rowCount,
    0,
  );
  assert.equal(
    (await db.query('select * from schedule_private.schedule_request where user_id=$1', [
      owners[0],
    ])).rowCount,
    0,
  );
  console.log(
    'Horario local: RLS, validación, salas, transacciones, concurrencia, idempotencia y cascada correctos.',
  );
} finally {
  await db.query('rollback');
  for (const owner of owners) {
    await db.query('delete from auth.users where id=$1', [owner]);
    await db.query('delete from public.estudiante where rut=$1', [`PLANNER-${owner}`]);
  }
  await db.end();
}
