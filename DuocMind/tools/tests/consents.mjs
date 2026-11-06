// Spec 016, RF-005/RF-007: un cliente authenticated registra y lee sus consentimientos.
// Las filas creadas se identifican por id posterior a la línea base y se borran al final.
import assert from "node:assert/strict";
import { authClient, database, fixtures } from "../scripts/runtime.mjs";

const f = fixtures(), db = await database();
const ids = [f.student.studentId, f.dual.studentId];
const baseline = Number((await db.query(
  "select coalesce(max(id_estudiante_consentimiento), 0) as m from public.estudiante_consentimiento",
)).rows[0].m);

try {
  const client = authClient();
  const login = await client.auth.signInWithPassword({ email: f.student.email, password: f.student.password });
  assert(!login.error, "login del estudiante sintético");

  // El id del consentimiento se resuelve por código, como hace la app.
  const catalog = await client.from("consentimiento").select("id_consentimiento").eq("codigo", "analitica_anonima").single();
  assert(!catalog.error, "el catálogo es legible para authenticated");
  const consentId = catalog.data.id_consentimiento;
  const row = (studentId, granted) => ({
    estudiante_id_estudiante: studentId,
    consentimiento_id_consentimiento: consentId,
    otorgado: granted,
    version: "v1",
  });
  const current = async () => {
    const { data, error } = await client.from("estudiante_consentimiento_actual")
      .select("codigo, otorgado").eq("estudiante_id_estudiante", f.student.studentId);
    assert(!error, "lectura de la vista");
    return data;
  };

  assert.deepEqual(await current(), [], "sin filas significa no otorgado");

  // Inserta su propia fila con solo las cuatro columnas permitidas.
  assert(!(await client.from("estudiante_consentimiento").insert(row(f.student.studentId, true))).error, "inserta su fila");
  assert.deepEqual(await current(), [{ codigo: "analitica_anonima", otorgado: true }]);

  // Revocar agrega otra fila; la vista entrega la última.
  assert(!(await client.from("estudiante_consentimiento").insert(row(f.student.studentId, false))).error);
  assert.deepEqual(await current(), [{ codigo: "analitica_anonima", otorgado: false }]);

  // No puede insertar para otro estudiante.
  const other = await client.from("estudiante_consentimiento").insert(row(f.dual.studentId, true));
  assert(other.error, "insertar para otro estudiante se rechaza");
  const leaked = await db.query(
    "select count(*)::int as n from public.estudiante_consentimiento where estudiante_id_estudiante = $1 and id_estudiante_consentimiento > $2",
    [f.dual.studentId, baseline],
  );
  assert.equal(leaked.rows[0].n, 0, "no quedó ninguna fila para el otro estudiante");

  // El servidor fija registrado_en: el cliente no puede enviarlo ni modificar el historial.
  assert((await client.from("estudiante_consentimiento")
    .insert({ ...row(f.student.studentId, true), registrado_en: "2000-01-01T00:00:00Z" })).error, "registrado_en no se acepta");
  assert((await client.from("estudiante_consentimiento").update({ otorgado: true }).eq("estudiante_id_estudiante", f.student.studentId)).error, "sin UPDATE");
  assert((await client.from("estudiante_consentimiento").delete().eq("estudiante_id_estudiante", f.student.studentId)).error, "sin DELETE");

  // Las filas de otra persona no son visibles.
  await db.query(
    "insert into public.estudiante_consentimiento(estudiante_id_estudiante, consentimiento_id_consentimiento, otorgado, version) values ($1,$2,true,'v1')",
    [f.dual.studentId, consentId],
  );
  const all = await client.from("estudiante_consentimiento_actual").select("estudiante_id_estudiante");
  assert(!all.error);
  assert(all.data.every((r) => r.estudiante_id_estudiante === Number(f.student.studentId)), "solo ve lo propio");
  console.log("consents OK");
} finally {
  await db.query(
    "delete from public.estudiante_consentimiento where estudiante_id_estudiante = any($1) and id_estudiante_consentimiento > $2",
    [ids, baseline],
  );
  await db.end();
}
