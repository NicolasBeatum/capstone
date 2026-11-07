import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';
import { database, projectRoot, runtime } from '../scripts/runtime.mjs';
const migrations = path.join(projectRoot, 'supabase/migrations');
const removal = fs.readdirSync(migrations).find((f) => f.endsWith('_remove_personal_schedule.sql'));
const root = await database(), name = 'planner_removal_' + crypto.randomBytes(6).toString('hex');
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
      fs.readFileSync(path.join(migrations, filename), 'utf8'),
    );
  }
  const owner = crypto.randomUUID(),
    sem = crypto.randomUUID(),
    doc = {
      schema: 1,
      activeSemesterId: sem,
      semesters: [{ id: sem, name: 'Retiro sintético', startsOn: null, endsOn: null }],
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
  await db.query('select public.save_personal_schedule(0,$1,$2)', [crypto.randomUUID(), doc]);
  await db.query('commit');
  assert.equal((await db.query('select * from public.schedule_semester')).rowCount, 1);
  await db.query(fs.readFileSync(path.join(migrations, removal), 'utf8'));
  const left = (await db.query(
    "select relname from pg_class where relnamespace='public'::regnamespace and relname in ('personal_schedule','schedule_semester','schedule_subject','schedule_block')",
  )).rows;
  assert.deepEqual(left, []);
  assert.equal(
    (await db.query("select 1 from pg_namespace where nspname='schedule_private'")).rowCount,
    0,
  );
  assert.equal(
    (await db.query(
      "select 1 from pg_proc where proname in ('load_personal_schedule','save_personal_schedule')",
    )).rowCount,
    0,
  );
  assert((await db.query("select to_regclass('public.asignatura') existing")).rows[0].existing);
  assert.equal(
    (await db.query('select * from public.estudiante where auth_user_id=$1', [owner])).rowCount,
    1,
  );
  console.log('Retiro del horario en base temporal: objetos eliminados y resto del esquema intacto.');
} finally {
  if (db) await db.end();
  if (created) await root.query(`drop database ${name}`);
  await root.end();
}
