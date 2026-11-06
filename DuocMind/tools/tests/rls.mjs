import assert from "node:assert/strict";
import { database, fixtures } from "../scripts/runtime.mjs";
const db = await database();
try {
  await db.query("begin");
  const cat = (await db.query(
    "insert into public.test_catalogo(code,kind) values('fixture_rls','custom') returning catalog_id",
  )).rows[0].catalog_id;
  const t = (await db.query(
    "insert into public.test_bienestar(nombre_test,tipo_test,version,puntaje_maximo,catalog_id) values('Fixture RLS','custom',1,1,$1) returning id_test",
    [cat],
  )).rows[0].id_test;
  const q = (await db.query(
    "insert into public.pregunta_test(test_id,test_version,orden,texto_pregunta) values($1,1,1,'Fixture RLS') returning id_pregunta",
    [t],
  )).rows[0].id_pregunta;
  await db.query(
    "insert into public.opcion_respuesta(pregunta_test_id_pregunta,texto_opcion,puntaje) values($1,'No',0)",
    [q],
  );
  await db.query(
    "insert into public.test_resultado_nivel(test_id,test_version,nivel_resultado,puntaje_minimo,puntaje_maximo) values($1,1,'fixture',0,1)",
    [t],
  );
  // Herramienta inactiva (borrador): no debe ser legible ni ella ni su vínculo de tipo.
  const tool = (await db.query(
    "insert into public.herramienta(titulo,imagen_path,activo) values('Fixture RLS','fixtures/rls.png',false) returning id",
  )).rows[0].id;
  const kind = (await db.query(
    "insert into public.tipo_herramienta(nombre) values('Fixture RLS') returning id",
  )).rows[0].id;
  await db.query(
    "insert into public.herramienta_tipoherramienta(herramienta_id,tipo_id) values($1,$2)",
    [tool, kind],
  );
  const activeTool = (await db.query(
    "insert into public.herramienta(titulo,imagen_path) values('Fixture RLS activa','fixtures/rls.png') returning id",
  )).rows[0].id;
  await db.query(
    "insert into public.evento_institucional(title,location,starts_at,ends_at) values('Fixture RLS','Local',now(),now())",
  );
  for (const role of ["anon", "authenticated"]) {
    await db.query("savepoint actor");
    await db.query(`set local role ${role}`);
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [
      fixtures().dual.id,
    ]);
    for (
      const [sql, args] of [
        ["select * from public.test_catalogo where catalog_id=$1", [cat]],
        ["select * from public.test_bienestar where id_test=$1", [t]],
        ["select * from public.pregunta_test where test_id=$1", [t]],
        [
          "select * from public.opcion_respuesta where pregunta_test_id_pregunta=$1",
          [q],
        ],
        ["select * from public.test_resultado_nivel where test_id=$1", [t]],
        ["select * from public.herramienta where id=$1", [tool]],
        [
          "select * from public.herramienta_tipoherramienta where herramienta_id=$1",
          [tool],
        ],
        [
          "select * from public.evento_institucional where title='Fixture RLS'",
          [],
        ],
      ]
    ) assert.equal((await db.query(sql, args)).rowCount, 0);
    assert.equal(
      (await db.query("select * from public.herramienta where id=$1", [
        activeTool,
      ])).rowCount,
      1,
    );
    assert(
      (await db.query(
        "select * from public.test_bienestar where publication_status='published'",
      )).rowCount >= 4,
    );
    if (role === "authenticated") {
      assert.equal(
        (await db.query("select id_estudiante from public.estudiante"))
          .rowCount,
        1,
      );
    }
    await db.query("rollback to savepoint actor");
  }
  assert.equal(
    (await db.query(
      "select count(*)::int n from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.prosecdef",
    )).rows[0].n,
    0,
  );
  await db.query("rollback");
  console.log(
    "T008: RLS de padres/hijos, lectura publicada, perfil propio y rutinas invoker verificados.",
  );
} finally {
  await db.end();
}
