import assert from 'node:assert/strict';
import { database } from '../scripts/runtime.mjs';
const db = await database();
try {
  await db.query('begin');
  const draft = (await db.query("insert into public.evento_institucional(title,location,starts_at,ends_at) values('Borrador sintético','Local',now(),now()) returning id")).rows[0];
  const published = (await db.query("insert into public.evento_institucional(title,location,starts_at,ends_at,status,published_at) select 'Fixture catálogo '||i,'Local',now(),now(),'published',now() from generate_series(1,1002) i returning id")).rows;
  await db.query("update public.evento_institucional set status='cancelled',revision=revision+1 where id=$1", [published[0].id]);
  await db.query('set local role authenticated');
  const result = (await db.query('select public.get_student_events() result')).rows[0].result;
  assert.equal(result.events.some(e=>e.id===draft.id), false);
  assert.equal(result.events.filter(e=>published.some(p=>p.id===e.id)).length, 1002);
  assert.equal(result.events.find(e=>e.id===published[0].id).status,'cancelled');
  assert.equal(typeof result.serverTime, 'string');
  assert.equal((await db.query('select public.get_student_events($1) result',[draft.id])).rows[0].result.events.length,0);
  assert.equal((await db.query('select public.get_student_events($1) result',[published[0].id])).rows[0].result.events.length,1);
  await db.query('set local role anon');
  await db.query('savepoint denied');
  await assert.rejects(db.query('select public.get_student_events()'), e=>e.code==='42501');
  await db.query('rollback to savepoint denied');
  await db.query('rollback');
  console.log('Catálogo: RLS, permisos, cancelados, consulta individual y más de 1000 eventos verificados.');
} finally { await db.end(); }
