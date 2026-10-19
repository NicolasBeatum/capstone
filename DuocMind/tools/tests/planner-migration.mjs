import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';
import { database, projectRoot, runtime } from '../scripts/runtime.mjs';
const root = await database(), name = 'planner_compat_' + crypto.randomBytes(6).toString('hex');
let db, created = false;
try {
  await root.query(`create database ${name}`);
  created = true;
  const url = new URL(runtime().DB_URL);
  url.pathname = '/' + name;
  db = new pg.Client({ connectionString: url.href });
  await db.connect();
  await db.query(
    "create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;create schema if not exists extensions;create extension if not exists pgcrypto with schema extensions;",
  );
  for (
    const filename of [
      '20260927224730_bienestar_schema.sql',
      '20261018175733_personal_semester_schedule.sql',
    ]
  ) {
    await db.query(
      fs.readFileSync(path.join(projectRoot, 'supabase/migrations', filename), 'utf8'),
    );
  }
  const tables = (await db.query(
    "select relname,relrowsecurity from pg_class where relnamespace='public'::regnamespace and relname in ('personal_schedule','schedule_semester','schedule_subject','schedule_block')",
  )).rows;
  assert.equal(tables.length, 4);
  assert(tables.every((t) => t.relrowsecurity));
  assert.equal(
    (await db.query(
      "select has_function_privilege('anon','public.save_personal_schedule(integer,uuid,jsonb)','EXECUTE') allowed",
    )).rows[0].allowed,
    false,
  );
  const owner = crypto.randomUUID(),
    sem = crypto.randomUUID(),
    doc = {
      schema: 1,
      activeSemesterId: sem,
      semesters: [{ id: sem, name: 'Compatibilidad sintética', startsOn: null, endsOn: null }],
      subjects: [],
      blocks: [],
    };
  await db.query('insert into auth.users(id) values($1)', [owner]);
  await db.query(
    "insert into public.estudiante(auth_user_id,rut,primer_nombre,primer_apellido) values($1,$2,'Prueba','Migración')",
    [owner, owner],
  );
  await db.query('begin');
  await db.query('set local role authenticated');
  await db.query("select set_config('request.jwt.claim.sub',$1,true)", [owner]);
  assert.equal(
    (await db.query('select public.save_personal_schedule(0,$1,$2) result', [
      crypto.randomUUID(),
      doc,
    ])).rows[0].result.revision,
    1,
  );
  await db.query('commit');
  const before =
    (await db.query('select row_to_json(p) data from public.personal_schedule p where user_id=$1', [
      owner,
    ])).rows[0].data;
  await db.query('begin');
  await db.query('delete from auth.users where id=$1', [owner]);
  assert.equal(
    (await db.query('select * from public.personal_schedule where user_id=$1', [owner])).rowCount,
    0,
  );
  await db.query('rollback');
  assert.deepEqual(
    (await db.query('select row_to_json(p) data from public.personal_schedule p where user_id=$1', [
      owner,
    ])).rows[0].data,
    before,
  );
  await db.query('begin');
  await db.query(
    'drop table public.schedule_block,public.schedule_subject,public.schedule_semester,public.personal_schedule cascade;drop schema schedule_private cascade',
  );
  assert((await db.query("select to_regclass('public.asignatura') existing")).rows[0].existing);
  await db.query('rollback');
  assert.equal(
    (await db.query('select * from public.schedule_semester where user_id=$1', [owner])).rowCount,
    1,
  );
  console.log(
    'Migración de horario en base temporal: instalación, permisos, cascada, reversión y recuperación correctos.',
  );
} finally {
  if (db) await db.end();
  if (created) await root.query(`drop database ${name}`);
  await root.end();
}
