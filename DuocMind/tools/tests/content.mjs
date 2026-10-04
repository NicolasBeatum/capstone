import assert from "node:assert/strict";
import { database } from "../scripts/runtime.mjs";
const db = await database();
try {
  await db.query("begin");
  const t = (await db.query(
    "insert into public.material_apoyo(titulo,descripcion) values('Tip sintético','Contenido no diagnóstico') returning id_material",
  )).rows[0].id_material;
  const level = (await db.query(
    "select n.* from public.test_resultado_nivel n join public.test_bienestar t on t.id_test=n.test_id limit 1",
  )).rows[0];
  await db.query(
    "update public.test_bienestar set is_active=false,revision=revision+1 where id_test=$1",
    [level.test_id],
  );
  await db.query(
    "insert into public.material_test(material_apoyo_id_material,test_id,test_version,nivel_resultado) values($1,$2,$3,$4)",
    [t, level.test_id, level.test_version, level.nivel_resultado],
  );
  for (
    const [sql, args, code] of [[
      "insert into public.evento_institucional(title,location,starts_at,ends_at) values('Fixture','Local',now(),now()-interval '1 hour')",
      [],
      "23514",
    ], [
      "insert into public.material_test(material_apoyo_id_material,test_id,test_version,nivel_resultado) values($1,$2,$3,$4)",
      [t, level.test_id, level.test_version, level.nivel_resultado],
      "23505",
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
  assert.equal(
    (await db.query(
      "select count(*)::int n from public.material_apoyo where titulo in ('Técnica Pomodoro 25/5','Meditación Guiada (3 min)','Higiene del Sueño')",
    )).rows[0].n,
    3,
  );
  await db.query("rollback");
  console.log(
    "T007: fechas, unicidad, reglas a versiones históricas y cancelación conservada verificados.",
  );
} finally {
  await db.end();
}
