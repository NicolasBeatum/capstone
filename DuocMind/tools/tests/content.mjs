import assert from "node:assert/strict";
import { database } from "../scripts/runtime.mjs";
const db = await database();
try {
  await db.query("begin");
  const tool = (await db.query(
    "insert into public.herramienta(titulo,contenido,imagen_path) values('Herramienta sintética','Contenido no diagnóstico','fixtures/sintetica.png') returning id",
  )).rows[0].id;
  const kind = (await db.query(
    "insert into public.tipo_herramienta(nombre) values('Tipo sintético') returning id",
  )).rows[0].id;
  await db.query(
    "insert into public.herramienta_tipoherramienta(herramienta_id,tipo_id) values($1,$2)",
    [tool, kind],
  );
  for (
    const [sql, args, code] of [[
      "insert into public.evento_institucional(title,location,starts_at,ends_at) values('Fixture','Local',now(),now()-interval '1 hour')",
      [],
      "23514",
    ], [
      "insert into public.herramienta_tipoherramienta(herramienta_id,tipo_id) values($1,$2)",
      [tool, kind],
      "23505",
    ], [
      "insert into public.herramienta(titulo,imagen_path,video_url) values('Video inseguro','fixtures/sintetica.png','http://ejemplo.test/video')",
      [],
      "23514",
    ]]
  ) {
    await db.query("savepoint negative");
    await assert.rejects(db.query(sql, args), (e) => e.code === code);
    await db.query("rollback to savepoint negative");
  }
  const e = (await db.query(
    "insert into public.evento_institucional(title,location,starts_at,ends_at,status,published_at) values('Fixture','Local',now(),now(),'published',now()) returning id,published_at",
  )).rows[0];
  await db.query(
    "update public.evento_institucional set status='cancelled',revision=revision+1 where id=$1",
    [e.id],
  );
  assert.deepEqual(
    (await db.query(
      "select published_at from public.evento_institucional where id=$1",
      [e.id],
    )).rows[0].published_at,
    e.published_at,
  );
  await db.query("rollback");
  console.log(
    "T007: fechas, unicidad de tipos de herramienta, enlaces https y cancelación conservada verificados.",
  );
} finally {
  await db.end();
}
