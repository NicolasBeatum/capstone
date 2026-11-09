// Spec 018, CA-004 y CA-013: la lectura pública de recursos de bienestar solo devuelve lo activo y
// ninguna cuenta anónima ni de estudiante puede escribir en las tablas de herramientas. También
// comprueba que la consulta real de la aplicación se interpreta con el dominio (`parseCatalog`).
// Crea herramientas sintéticas y las borra al terminar. Solo base local.
import assert from "node:assert/strict";
import { authClient, database, fixtures } from "../scripts/runtime.mjs";
import {
  PREFIX,
  cleanWellnessFixtures,
  createWellnessFixtures,
} from "../scripts/wellness-fixtures.mjs";
import {
  categoriesWithResources,
  filterResources,
  parseCatalog,
} from "../../src/features/wellness/domain/wellnessResource.ts";

const f = fixtures();
const db = await database();

// La misma consulta que usa la aplicación (supabaseResourceGateway.ts).
const TOOL_COLUMNS =
  "id, titulo, descripcion, contenido, imagen_path, video_url, created_at, herramienta_tipoherramienta(tipo_id)";
const readCatalog = async (client) => {
  const [categories, resources] = await Promise.all([
    client.from("tipo_herramienta").select("id, nombre, orden").order("orden").order("nombre"),
    client
      .from("herramienta")
      .select(TOOL_COLUMNS)
      .eq("activo", true)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(200),
  ]);
  assert(!categories.error, "las categorías se leen sin error");
  assert(!resources.error, "los recursos se leen sin error");
  return { categories: categories.data, resources: resources.data };
};

const syntheticRows = async () =>
  (await db.query(
    "select id, titulo, activo, imagen_path from public.herramienta where starts_with(titulo, $1) order by id",
    [PREFIX],
  )).rows;
const counts = async () => ({
  tools: Number((await db.query("select count(*) c from public.herramienta")).rows[0].c),
  types: Number((await db.query("select count(*) c from public.tipo_herramienta")).rows[0].c),
  links: Number((await db.query("select count(*) c from public.herramienta_tipoherramienta")).rows[0].c),
});

try {
  const ids = await createWellnessFixtures(db);
  const before = await counts();
  const rowsBefore = JSON.stringify(await syntheticRows());

  const anon = authClient();
  const student = authClient();
  const login = await student.auth.signInWithPassword({ email: f.student.email, password: f.student.password });
  assert(!login.error, "el estudiante sintético inicia sesión");

  for (const [name, client] of [["anónimo", anon], ["estudiante", student]]) {
    // CA-004: solo se leen las herramientas activas, de la más reciente a la más antigua.
    const raw = await readCatalog(client);
    const mine = raw.resources.filter((row) => row.titulo.startsWith(PREFIX));
    assert.equal(mine.length, 5, `${name}: 5 herramientas sintéticas activas`);
    assert(!mine.some((row) => row.id === ids.inactivo), `${name}: la inactiva no se lee`);
    const times = raw.resources.map((row) => Date.parse(row.created_at));
    assert.deepEqual(times, [...times].sort((a, b) => b - a), `${name}: orden por fecha descendente`);

    // Los cuatro tipos cargados por migración, en su orden.
    const names = raw.categories.map((row) => row.nombre);
    for (const expected of ["Estrés", "Ansiedad", "Apoyo al estudio", "Salud física"]) {
      assert(names.includes(expected), `${name}: tipo ${expected}`);
    }

    // La relación de una herramienta inactiva no se ve.
    const links = await client.from("herramienta_tipoherramienta").select("herramienta_id");
    assert(!links.error);
    assert(!links.data.some((row) => row.herramienta_id === ids.inactivo), `${name}: relación de la inactiva oculta`);
    const direct = await client.from("herramienta").select("id").eq("id", ids.inactivo);
    assert(!direct.error);
    assert.equal(direct.data.length, 0, `${name}: la inactiva no se lee ni por id`);

    // La respuesta real se interpreta con el dominio de la aplicación.
    const catalog = parseCatalog(raw);
    const synthetic = catalog.resources.filter((r) => r.title.startsWith(PREFIX));
    assert.equal(synthetic.length, 5);
    const byTitle = (title) => synthetic.find((r) => r.title === PREFIX + title);
    assert.equal(byTitle("Técnica Pomodoro").description, null, "sin descripción");
    assert.equal(byTitle("Recurso con ruta de imagen insegura").imagePath, null, "ruta insegura");
    assert.equal(byTitle("Respiración 4-7-8").videoUrl, "https://example.test/video/respiracion");
    assert.equal(byTitle("Pausa consciente de 5 minutos").categoryIds.length, 2, "en dos categorías");
    assert.deepEqual(
      synthetic.map((r) => r.id),
      [ids.respiracion, ids.nervios, ids.pomodoro, ids.pausa, ids["imagen-insegura"]],
      `${name}: más nueva primero`,
    );
    const chips = categoriesWithResources(catalog).map((c) => c.name);
    assert.deepEqual(chips, ["Estrés", "Ansiedad", "Apoyo al estudio", "Salud física"], `${name}: chips`);
    const stress = catalog.categories.find((c) => c.name === "Estrés");
    assert.equal(
      filterResources(catalog, stress.id).filter((r) => r.title.startsWith(PREFIX)).length,
      2,
      `${name}: Estrés muestra Respiración y Pausa; la inactiva no`,
    );

    // CA-013: ninguna escritura es posible.
    const type = catalog.categories[0];
    const writes = [
      client.from("herramienta").insert({ titulo: "Intruso", imagen_path: "x.png" }),
      client.from("herramienta").update({ titulo: "Cambiado" }).eq("id", ids.respiracion),
      client.from("herramienta").delete().eq("id", ids.respiracion),
      client.from("tipo_herramienta").insert({ nombre: "Intruso", orden: 99 }),
      client.from("tipo_herramienta").update({ nombre: "Cambiado" }).eq("id", type.id),
      client.from("tipo_herramienta").delete().eq("id", type.id),
      client.from("herramienta_tipoherramienta").insert({ herramienta_id: ids.respiracion, tipo_id: type.id }),
      client.from("herramienta_tipoherramienta").delete().eq("herramienta_id", ids.respiracion),
    ];
    for (const [index, attempt] of writes.entries()) {
      const result = await attempt;
      assert(result.error, `${name}: la escritura ${index + 1} se rechaza`);
    }
  }

  // Nada cambió en la base tras todos los intentos.
  assert.deepEqual(await counts(), before, "los intentos de escritura no cambiaron ninguna tabla");
  assert.equal(JSON.stringify(await syntheticRows()), rowsBefore, "las filas sintéticas quedaron intactas");

  await student.auth.signOut();
  console.log("Recursos de bienestar: lectura pública solo de lo activo, escrituras rechazadas y consulta compatible con el dominio.");
} finally {
  await cleanWellnessFixtures(db);
  await db.end();
}
