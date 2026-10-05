import assert from "node:assert/strict";
import fs from "node:fs";
import { database } from "../scripts/runtime.mjs";
const db = await database();
try {
  await db.query("begin");
  const manifest = JSON.parse(
    fs.readFileSync(
      new URL("../../supabase/manifests/protected-tests.json", import.meta.url),
    ),
  );
  for (const i of manifest.instruments) {
    const t = (await db.query(
      "select * from public.test_bienestar t join public.test_catalogo c using(catalog_id) where c.code=$1",
      [i.code],
    )).rows[0];
    assert.equal(t.publication_status, "published");
    assert.equal(t.puntaje_maximo, i.max);
    const before = (await db.query(
      "select to_jsonb(p) data from public.pregunta_test p where test_id=$1 order by orden",
      [t.id_test],
    )).rows;
    assert.equal(before.length, i.questions.length);
    for (
      const sql of [
        "update public.test_bienestar set nombre_test='alterado' where id_test=$1",
        "update public.test_bienestar set publication_status='draft',published_at=null,is_active=false where id_test=$1",
        "update public.pregunta_test set texto_pregunta='alterado' where test_id=$1",
        "delete from public.test_resultado_nivel where test_id=$1",
      ]
    ) {
      await db.query("savepoint negative");
      await assert.rejects(
        db.query(sql, [t.id_test]),
        (e) => e.code === "P0422",
      );
      await db.query("rollback to savepoint negative");
    }
    await db.query(
      "update public.test_bienestar set is_active=false,revision=revision+1 where id_test=$1",
      [t.id_test],
    );
    assert.deepEqual(
      (await db.query(
        "select to_jsonb(p) data from public.pregunta_test p where test_id=$1 order by orden",
        [t.id_test],
      )).rows,
      before,
    );
  }
  assert.equal(
    (await db.query(
      "select count(*)::int n from public.test_catalogo where code='pss10' and kind='protected'",
    )).rows[0].n,
    1,
  );
  await db.query("rollback");
  console.log(
    "T006: manifiesto, congelación de contenido/estado e incremento de revisión verificados.",
  );
} finally {
  await db.end();
}
