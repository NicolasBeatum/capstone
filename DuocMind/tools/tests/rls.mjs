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
  const tip = (await db.query(
    "insert into public.material_apoyo(titulo,descripcion) values('Fixture RLS','Borrador') returning id_material",
  )).rows[0].id_material;
  await db.query(
    "insert into public.material_emocion(material_apoyo_id_material,emocion_general_id_emocion) select $1,id_emocion from public.emocion_general limit 1",
    [tip],
  );
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
        ["select * from public.material_apoyo where id_material=$1", [tip]],
        [
          "select * from public.material_emocion where material_apoyo_id_material=$1",
          [tip],
        ],
        [
          "select * from public.evento_institucional where title='Fixture RLS'",
          [],
        ],
      ]
    ) assert.equal((await db.query(sql, args)).rowCount, 0);
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
