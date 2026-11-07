// Spec 018: herramientas de bienestar SINTÉTICAS para verificar la sección «Recursos».
// Solo local (runtime() rechaza cualquier base que no sea 127.0.0.1/localhost). Es idempotente:
// borra las filas sintéticas anteriores (título con el prefijo) y las vuelve a crear.
// Uso: node tools/scripts/wellness-fixtures.mjs [--clean]
import { database } from "./runtime.mjs";

export const PREFIX = "[Sintético] ";

// Cada fila cubre un caso del plan: dos categorías, sin descripción, ruta de imagen insegura,
// inactiva. Las fechas son fijas para que el orden (más nueva primero) sea determinista.
export const FIXTURE_TOOLS = [
  {
    key: "respiracion",
    title: "Respiración 4-7-8",
    description: "Calma el cuerpo en tres minutos.",
    content: "Inhala 4 segundos, sostén 7 y exhala 8. Repite cuatro veces.",
    image: "sinteticos/respiracion.webp",
    video: "https://example.test/video/respiracion",
    active: true,
    createdAt: "2026-11-05T12:00:00Z",
    types: ["Estrés"],
  },
  {
    key: "nervios",
    title: "Bajar los nervios antes de una prueba",
    description: "Pasos breves para llegar con calma.",
    content: "Respira, ordena lo que sabes y empieza por lo que mejor dominas.",
    image: "sinteticos/nervios.webp",
    video: null,
    active: true,
    createdAt: "2026-11-04T12:00:00Z",
    types: ["Ansiedad"],
  },
  {
    key: "pomodoro",
    title: "Técnica Pomodoro",
    description: null,
    content: "Estudia 25 minutos y descansa 5. Cada cuatro bloques, una pausa larga.",
    image: "sinteticos/pomodoro.webp",
    video: null,
    active: true,
    createdAt: "2026-11-03T12:00:00Z",
    types: ["Apoyo al estudio"],
  },
  {
    key: "pausa",
    title: "Pausa consciente de 5 minutos",
    description: "Sirve para el estrés y para la ansiedad.",
    content: "Siéntate cómodo, cierra los ojos y nota tres sonidos a tu alrededor.",
    image: "sinteticos/pausa.webp",
    video: "https://example.test/video/pausa",
    active: true,
    createdAt: "2026-11-02T12:00:00Z",
    types: ["Estrés", "Ansiedad"],
  },
  {
    key: "imagen-insegura",
    title: "Recurso con ruta de imagen insegura",
    description: "Debe mostrarse con el marcador de imagen.",
    content: null,
    image: "../fuera/del-bucket.png",
    video: null,
    active: true,
    createdAt: "2026-11-01T12:00:00Z",
    types: ["Salud física"],
  },
  {
    key: "inactivo",
    title: "Recurso inactivo",
    description: "No debe verse en la aplicación.",
    content: "Contenido oculto.",
    image: "sinteticos/inactivo.webp",
    video: null,
    active: false,
    createdAt: "2026-11-06T12:00:00Z",
    types: ["Estrés"],
  },
];

/** Borra las herramientas sintéticas (la relación con tipos cae por cascada). */
export async function cleanWellnessFixtures(db) {
  await db.query("delete from public.herramienta where starts_with(titulo, $1)", [PREFIX]);
}

/** Crea las herramientas sintéticas y devuelve `{ key: id }`. */
export async function createWellnessFixtures(db) {
  await cleanWellnessFixtures(db);
  const types = new Map(
    (await db.query("select id, nombre from public.tipo_herramienta")).rows.map((r) => [r.nombre, r.id]),
  );
  const ids = {};
  for (const tool of FIXTURE_TOOLS) {
    const inserted = await db.query(
      `insert into public.herramienta (titulo, descripcion, contenido, imagen_path, video_url, activo, created_at)
       values ($1, $2, $3, $4, $5, $6, $7) returning id`,
      [PREFIX + tool.title, tool.description, tool.content, tool.image, tool.video, tool.active, tool.createdAt],
    );
    const id = Number(inserted.rows[0].id);
    ids[tool.key] = id;
    for (const name of tool.types) {
      const typeId = types.get(name);
      if (typeId === undefined) throw new Error(`Falta el tipo de herramienta «${name}» en la base local.`);
      await db.query(
        "insert into public.herramienta_tipoherramienta (herramienta_id, tipo_id) values ($1, $2)",
        [id, typeId],
      );
    }
  }
  return ids;
}

if (import.meta.url === new URL(process.argv[1], "file://").href || process.argv[1]?.endsWith("wellness-fixtures.mjs")) {
  const db = await database();
  try {
    if (process.argv.includes("--clean")) {
      await cleanWellnessFixtures(db);
      console.log("Herramientas sintéticas eliminadas.");
    } else {
      const ids = await createWellnessFixtures(db);
      console.log(`Herramientas sintéticas preparadas: ${Object.keys(ids).length} (una inactiva). Solo base local.`);
    }
  } finally {
    await db.end();
  }
}
