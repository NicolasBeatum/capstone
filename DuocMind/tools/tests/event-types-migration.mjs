import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { database, projectRoot } from "../scripts/runtime.mjs";
const db = await database();
try {
  await db.query("begin");
  // Recrear el estado anterior solo dentro de la transacción; rollback restaura todo.
  const before = (await db.query(
    "select id,code,nombre,orden from public.tipo_evento_institucional order by id",
  )).rows;
  await db.query(
    "drop trigger event_type_code_immutable on public.tipo_evento_institucional",
  );
  await db.query(
    "drop function private.check_event_type_code();drop function private.parse_event_type_id(jsonb)",
  );
  await db.query(
    "alter table public.tipo_evento_institucional drop column revision,drop constraint event_type_name_trimmed,drop constraint event_type_order_valid",
  );
  const file = path.join(
    projectRoot,
    "supabase/migrations/20261016015100_admin_event_types.sql",
  );
  // Solo se reaplica la parte de esquema (columnas, restricciones y disparadores):
  // las definiciones históricas de admin_mutate/admin_read referencian tablas eliminadas
  // y su comportamiento vigente lo cubren event-types.mjs y event-types-api.mjs.
  const full = fs.readFileSync(file, "utf8");
  const cut = full.indexOf("create or replace function public.admin_mutate");
  assert(cut > 0);
  const migration = full.slice(0, cut).replace(/^begin;\s*/, "");
  await db.query(
    "update public.tipo_evento_institucional set orden=-1 where id=1",
  );
  await db.query("savepoint incompatible");
  await assert.rejects(db.query(migration), (e) => e.code === "23514");
  await db.query("rollback to savepoint incompatible");
  await db.query(
    "update public.tipo_evento_institucional set orden=$1 where id=1",
    [before.find((t) => t.id === 1).orden],
  );
  await db.query(migration);
  assert.deepEqual(
    (await db.query(
      "select id,code,nombre,orden from public.tipo_evento_institucional order by id",
    )).rows,
    before,
  );
  assert(
    (await db.query("select revision from public.tipo_evento_institucional"))
      .rows.every((t) => t.revision === 1),
  );
  await db.query("rollback");
  console.log(
    "Migración tipos: aplicación completa conserva catálogo y rechaza datos heredados incompatibles, con rollback.",
  );
} finally {
  await db.query("rollback");
  await db.end();
}
