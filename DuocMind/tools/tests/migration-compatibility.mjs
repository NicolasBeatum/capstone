import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { database, projectRoot, runtime } from "../scripts/runtime.mjs";
const root = await database();
const name = "duocmind_admin_compat_fixture";
let db;
try {
  await root.query(`create database ${name}`);
  const u = new URL(runtime().DB_URL);
  u.pathname = "/" + name;
  db = new pg.Client({ connectionString: u.href });
  await db.connect();
  await db.query(
    "create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as 'select null::uuid';",
  );
  await db.query(
    fs.readFileSync(
      path.join(
        projectRoot,
        "supabase/migrations/20260927224730_bienestar_schema.sql",
      ),
      "utf8",
    ),
  );
  await db.query("create schema private");
  const id = (await db.query(
    "insert into public.test_bienestar(nombre_test,tipo_test,version,puntaje_maximo) values('Escala de Estrés Percibido (PSS-10)','FIXTURE SINTÉTICA NO VALIDADA',1,1) returning id_test",
  )).rows[0].id_test;
  const q = (await db.query(
    "insert into public.pregunta_test(test_id,test_version,orden,texto_pregunta) values($1,1,1,'Pregunta sintética de compatibilidad; no es PSS-10') returning id_pregunta",
    [id],
  )).rows[0].id_pregunta;
  await db.query(
    "insert into public.opcion_respuesta(pregunta_test_id_pregunta,texto_opcion,puntaje) values($1,'Fixture cero',0),($1,'Fixture uno',1)",
    [q],
  );
  const before = (await db.query(
    "select to_jsonb(t) data from public.test_bienestar t where id_test=$1",
    [id],
  )).rows[0].data;
  await db.query(
    "insert into public.test_bienestar(nombre_test,tipo_test,version,puntaje_maximo) values('Escala de Estrés Percibido (PSS-10)','FIXTURE',2,1)",
  );
  const sql = fs.readFileSync(
    path.join(
      projectRoot,
      "supabase/migrations/20261004202041_admin_test_versions.sql",
    ),
    "utf8",
  );
  await assert.rejects(db.query(sql), (e) => e.message === "PSS-10 ambiguo");
  await db.query("rollback");
  await db.query(
    "delete from public.test_bienestar where nombre_test='Escala de Estrés Percibido (PSS-10)' and version=2",
  );
  await db.query(sql);
  const after = (await db.query(
    "select to_jsonb(t) data from public.test_bienestar t where id_test=$1",
    [id],
  )).rows[0].data;
  for (const key of Object.keys(before)) {
    assert.deepEqual(after[key], before[key]);
  }
  assert.equal(
    (await db.query(
      "select texto_pregunta from public.pregunta_test where id_pregunta=$1",
      [q],
    )).rows[0].texto_pregunta,
    "Pregunta sintética de compatibilidad; no es PSS-10",
  );
  console.log(
    "T006: migración rechaza PSS-10 ambiguo; backfill compatible conserva IDs, opciones y contenido sintético. Base temporal eliminada.",
  );
} finally {
  if (db) await db.end();
  await root.query(`drop database if exists ${name}`);
  await root.end();
}
