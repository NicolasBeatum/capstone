import assert from "node:assert/strict";
import { database } from "../scripts/runtime.mjs";
const db = await database();
try {
  await db.query("begin");
  const types = (await db.query(
    "select id,code,nombre,orden,revision from public.tipo_evento_institucional where id<=3 order by id",
  )).rows;
  assert.deepEqual(types.map((t) => [t.id, t.code]), [[1, "charla"], [
    2,
    "taller",
  ], [3, "actividad"]]);
  assert(types.every((t) => t.revision > 0));
  const rejects = async (sql, code) => {
    await db.query("savepoint negative");
    await assert.rejects(db.query(sql), (e) => e.code === code);
    await db.query("rollback to savepoint negative");
  };
  await rejects(
    "update public.tipo_evento_institucional set code='changed' where id=1",
    "P0422",
  );
  await rejects(
    "update public.tipo_evento_institucional set nombre=' Charla ' where id=1",
    "23514",
  );
  await rejects(
    "update public.tipo_evento_institucional set orden=-1 where id=1",
    "23514",
  );
  await rejects(
    "update public.tipo_evento_institucional set revision=0 where id=1",
    "23514",
  );
  for (const role of ["anon", "authenticated"]) {
    await db.query("set local role " + role);
    assert(
      (await db.query("select id from public.tipo_evento_institucional"))
        .rowCount >= 3,
    );
    await rejects(
      "insert into public.tipo_evento_institucional(code,nombre) values('denied','Denegado')",
      "42501",
    );
    await rejects(
      "update public.tipo_evento_institucional set nombre='Denegado' where id=1",
      "42501",
    );
    await rejects(
      "delete from public.tipo_evento_institucional where id=1",
      "42501",
    );
    await db.query("reset role");
  }
  await db.query("rollback");
  console.log(
    "Tipos: identidad heredada, límites, código fijo y permisos comprobados.",
  );
} finally {
  await db.end();
}
