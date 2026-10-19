import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { authClient, database, fixtures, projectRoot } from '../scripts/runtime.mjs';
const db=await database(), auth=authClient(), f=fixtures();
try {
  const login=await auth.auth.signInWithPassword({email:f.staff.email,password:f.staff.password});
  assert(!login.error);
  const session=JSON.parse(Buffer.from(login.data.session.access_token.split('.')[1],'base64url')).session_id;
  await db.query('begin');
  const content={title:'Reversión sintética',description:'',location:'Patio',startsAt:'2030-10-12T12:00:00Z',endsAt:'2030-10-12T14:30:00Z'};
  const id=(await db.query("insert into public.evento_institucional(title,location,starts_at,ends_at,status,published_at,requires_registration,registration_url,registration_deadline) values($1,$2,$3,$4,'published',now(),true,'https://example.com/form','2030-10-11T12:00:00Z') returning id",[content.title,content.location,content.startsAt,content.endsAt])).rows[0].id;
  const registration=async()=> (await db.query('select requires_registration,registration_url,registration_deadline,registration_closed from public.evento_institucional where id=$1',[id])).rows[0];
  const before=await registration();
  for (const [file,name] of [['20261004202617_admin_transactions.sql','admin_mutate'],['20261004203446_admin_queries.sql','admin_read']]) {
    const sql=fs.readFileSync(path.join(projectRoot,'supabase/migrations',file),'utf8');
    const fn=sql.match(new RegExp('create(?: or replace)? function public\\.'+name+'\\([\\s\\S]*?\\$\\$;','i'))?.[0];
    assert(fn);await db.query(fn.replace(/^create function/i,'create or replace function'));
  }
  await db.query('revoke execute on function public.get_student_events(uuid) from authenticated');
  assert.equal((await db.query("select has_function_privilege('authenticated','public.get_student_events(uuid)','execute') allowed")).rows[0].allowed,false);
  await db.query('set local role service_role');
  await db.query('select public.admin_mutate($1,$2,$3,$4,$5)',[f.staff.id,session,'PUT','/events/'+id,{...content,title:'Edición con cliente anterior',requestId:crypto.randomUUID(),expectedRevision:1}]);
  assert.deepEqual(await registration(),before);
  const result=(await db.query("select public.admin_read($1,$2,'/events','{}') result",[f.staff.id,session])).rows[0].result;
  assert.ok(result.some(event=>event.id===id && event.title==='Edición con cliente anterior'));
  await db.query('rollback');
  assert.equal((await db.query("select has_function_privilege('authenticated','public.get_student_events(uuid)','execute') allowed")).rows[0].allowed,true);
  console.log('Reversión transaccional local: cliente anterior conserva condiciones, RPC revocable y restauración confirmada.');
} finally { await db.query('rollback'); await db.end(); await auth.auth.signOut(); }
