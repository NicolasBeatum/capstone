// Datos sintéticos para mirar el dashboard de bienestar (spec 023).
// Crea unos 320 estudiantes `demo-*` en 7 carreras, más una carrera con 3 para ver la agrupación
// en «Otras carreras», con 90 días de check-ins, motivos y tests PSS-10 con patrones
// reconocibles. Es idempotente: borra y recrea solo sus estudiantes.
//
//   node scripts/wellbeing-demo.mjs                      carga en el Supabase local
//   node scripts/wellbeing-demo.mjs --remove             borra solo lo que crea este script
//   --existing-careers                                   usa carreras que ya existen en vez de crear
//                                                        las «(demo)», que la app mostraría al registrarse
//   --cloud=<project-ref>                                apunta al proyecto en la nube; exige
//                                                        WELLBEING_DEMO_DB_URL con ese ref, que coincida con
//                                                        el proyecto vinculado, e implica --existing-careers
//
// Todo lo creado se identifica por el correo `demo-NNN@duocmind.example.test`; las filas
// dependientes se borran por estudiante y las carreras «(demo)» solo si nadie más las usa. En la
// nube nunca crea un PSS-10 sintético: si no hay uno activo, se detiene.
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { database, projectRoot, runtime } from "./runtime.mjs";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const cloudRef = args.find((a) => a.startsWith("--cloud="))?.slice("--cloud=".length);
const remove = flag("remove");
const existingCareers = flag("existing-careers") || Boolean(cloudRef);
const unknown = args.filter((a) => !["--remove", "--existing-careers"].includes(a) && !a.startsWith("--cloud="));
if (unknown.length) throw new Error(`Opciones desconocidas: ${unknown.join(" ")}`);

async function cloudDatabase(ref) {
  const linked = fs.readFileSync(path.join(projectRoot, "supabase/.temp/project-ref"), "utf8").trim();
  if (!/^[a-z0-9]{20}$/.test(ref) || ref !== linked) {
    throw new Error("--cloud debe ser el project-ref del proyecto vinculado.");
  }
  const url = process.env.WELLBEING_DEMO_DB_URL;
  if (!url || new URL(url).username !== `postgres.${ref}`) {
    throw new Error("WELLBEING_DEMO_DB_URL debe ser la conexión del pooler de ese proyecto.");
  }
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  return client;
}

if (!cloudRef) runtime();
const db = cloudRef ? await cloudDatabase(cloudRef) : await database();
const where = cloudRef ? `la nube (${cloudRef})` : "Supabase local";
const PSS10 = "Escala de Estrés Percibido (PSS-10)";
const EMAIL = (n) => `demo-${String(n).padStart(3, "0")}@duocmind.example.test`;
const CAREERS = [
  ["Ingeniería en Informática (demo)", 56, -0.2],
  ["Técnico en Enfermería (demo)", 50, 0.1],
  ["Diseño Gráfico (demo)", 46, 0.3],
  ["Contabilidad General (demo)", 44, -0.4],
  ["Administración de Empresas (demo)", 42, 0],
  ["Ingeniería en Construcción (demo)", 40, -0.1],
  ["Gastronomía (demo)", 42, 0.2],
  ["Turismo (demo)", 3, 0],
];
// Peso de cada motivo según el ánimo (1 a 5): todos aparecen con todas las emociones, para que
// la matriz de motivos tenga al menos 5 estudiantes por celda en 30 días, pero con tendencias.
const REASONS = {
  "Académico": [6, 5, 3.5, 2.5, 2],
  "Económico": [3, 2.5, 1.5, 1, 0.8],
  "Salud": [2.5, 2, 1.5, 1.2, 1],
  "Familia": [2, 2, 2.5, 3, 3],
  "Trabajo": [1.5, 1.5, 1.5, 1.2, 1],
  "Pareja": [1.2, 1.2, 1.5, 2, 2.5],
  "Amistades": [1, 1.2, 2.5, 3.5, 4],
  "Otro": [0.9, 0.9, 0.9, 0.9, 0.9],
};
const DAYS = 90;

// Generador determinista: los mismos datos en cada ejecución.
let seed = 20261116;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const normal = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
const pick = (weights) => {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let x = rand() * total;
  for (const [k, w] of Object.entries(weights)) if ((x -= w) < 0) return k;
  return Object.keys(weights)[0];
};

try {
  await db.query("begin");
  const removed = await removeDemo();
  if (remove) {
    await db.query("commit");
    console.log(
      `Datos de demostración borrados de ${where}: ${removed.students} estudiantes, ` +
        `${removed.checkins} check-ins, ${removed.tests} tests y ${removed.careers} carreras «(demo)».`,
    );
  } else {
  // PSS-10: se usa el activo; si la base local no lo tiene, se crea uno sintético solo con
  // niveles (leve 0–13, moderado 14–26, severo 27–40), sin preguntas.
  let test = (await db.query(
    "select id_test id, version from public.test_bienestar where nombre_test=$1 and is_active",
    [PSS10],
  )).rows[0];
  if (!test && cloudRef) throw new Error("No hay un PSS-10 activo en la nube; no se crea uno sintético.");
  if (!test) {
    const version = 1 + (await db.query(
      "select coalesce(max(version),0)::int v from public.test_bienestar where nombre_test=$1",
      [PSS10],
    )).rows[0].v;
    test = (await db.query(
      `insert into public.test_bienestar(nombre_test,tipo_test,version,puntaje_maximo,catalog_id,scoring_kind)
       select $1,'DEMO SINTÉTICA',$2,40,catalog_id,'pss10' from public.test_catalogo where code='pss10'
       returning id_test id, version`,
      [PSS10, version],
    )).rows[0];
    for (const [level, min, max, label] of [["leve", 0, 13, "Estrés leve"], ["moderado", 14, 26, "Estrés moderado"], ["severo", 27, 40, "Estrés severo"]]) {
      await db.query(
        "insert into public.test_resultado_nivel(test_id,test_version,nivel_resultado,puntaje_minimo,puntaje_maximo,label) values($1,$2,$3,$4,$5,$6)",
        [test.id, test.version, level, min, max, label],
      );
    }
    await db.query(
      "update public.test_bienestar set publication_status='published',published_at=now(),is_active=true where id_test=$1",
      [test.id],
    );
    await db.query(
      "update public.test_catalogo set active_version_id=$1 where code='pss10'",
      [test.id],
    );
  }
  const levels = (await db.query(
    "select nivel_resultado, puntaje_minimo, puntaje_maximo from public.test_resultado_nivel where test_id=$1 and test_version=$2",
    [test.id, test.version],
  )).rows;
  const levelOf = (score) => levels.find((l) => score >= l.puntaje_minimo && score <= l.puntaje_maximo)?.nivel_resultado;

  const consents = Object.fromEntries((await db.query(
    "select codigo, id_consentimiento from public.consentimiento",
  )).rows.map((r) => [r.codigo, r.id_consentimiento]));
  const moods = Object.fromEntries((await db.query(
    "select valor_escala, id_emocion from public.emocion_general",
  )).rows.map((r) => [r.valor_escala, r.id_emocion]));
  const reasons = Object.fromEntries((await db.query(
    "select nombre_motivo, id_motivo from public.motivo where activo",
  )).rows.map((r) => [r.nombre_motivo, r.id_motivo]));
  const today = (await db.query("select (now() at time zone 'America/Santiago')::date::text d")).rows[0].d;

  let n = 0;
  const summary = { students: 0, sharing: 0, checkins: 0, tests: 0, deletions: 0 };
  const checkins = { student: [], career: [], mood: [], at: [], reasons: [] };
  const applications = { student: [], career: [], score: [], level: [], at: [] };
  // Con --existing-careers se reparten en las primeras carreras existentes por nombre, sin crear
  // ninguna; si no, en las «(demo)».
  const existing = existingCareers
    ? (await db.query(
      "select id_carrera from public.carrera where nombre_carrera not like '%(demo)' order by nombre_carrera limit $1",
      [CAREERS.length],
    )).rows.map((r) => r.id_carrera)
    : [];
  if (existingCareers && existing.length < CAREERS.length) throw new Error("Faltan carreras existentes.");
  for (const [index, [name, size, careerMood]] of CAREERS.entries()) {
    const careerId = existingCareers ? existing[index] : (await db.query(
      "insert into public.carrera(nombre_carrera) values($1) on conflict(nombre_carrera) do update set nombre_carrera=excluded.nombre_carrera returning id_carrera",
      [name],
    )).rows[0].id_carrera;
    for (let i = 0; i < size; i++) {
      n++;
      const id = (await db.query(
        "insert into public.estudiante(auth_user_id,rut,primer_nombre,primer_apellido,correo) values(null,$1,'Demo',$2,$3) returning id_estudiante",
        [`DEMO-${n}`, `Estudiante ${n}`, EMAIL(n)],
      )).rows[0].id_estudiante;
      const ec = (await db.query(
        "insert into public.estudiante_carrera(estudiante_id_estudiante,carrera_id_carrera) values($1,$2) returning id_estudiante_carrera",
        [id, careerId],
      )).rows[0].id_estudiante_carrera;
      summary.students++;
      // ~60 % comparte datos anónimos; del resto, la mitad solo autoriza contacto (sus datos
      // suben pero no cuentan) y la otra mitad no autoriza nada (no debería tener datos).
      const r = rand();
      const share = r < 0.7, contact = !share && r < 0.85;
      if (share) {
        summary.sharing++;
        await db.query(
          `insert into public.estudiante_consentimiento(estudiante_id_estudiante,consentimiento_id_consentimiento,otorgado,version,registrado_en)
           values($1,$2,true,'v1',now() - interval '120 days')`,
          [id, consents.analitica_anonima],
        );
      }
      if (contact || (share && rand() < 0.3)) {
        await db.query(
          `insert into public.estudiante_consentimiento(estudiante_id_estudiante,consentimiento_id_consentimiento,otorgado,version,registrado_en)
           values($1,$2,true,'v1',now() - interval '120 days')`,
          [id, consents.contacto],
        );
      }
      if (!share && !contact) continue;
      const base = 3.4 + careerMood + normal() * 0.55;
      const frequency = 0.45 + rand() * 0.4;
      for (let d = DAYS - 1; d >= 0; d--) {
        if (rand() > frequency) continue;
        const date = new Date(today + "T12:00:00Z");
        date.setUTCDate(date.getUTCDate() - d);
        const weekday = date.getUTCDay(); // 0 domingo, 1 lunes
        const progress = (DAYS - 1 - d) / (DAYS - 1); // 0 al inicio, 1 hoy
        const effect = (weekday === 1 ? -0.8 : 0) + (weekday === 0 || weekday === 6 ? 0.35 : 0) - progress * 0.5;
        const mood = Math.min(5, Math.max(1, Math.round(base + effect + normal() * 0.85)));
        const chosen = new Set();
        const count = rand() < 0.15 ? 0 : rand() < 0.6 ? 1 : 2;
        for (let k = 0; k < count; k++) {
          chosen.add(pick(Object.fromEntries(Object.entries(REASONS).map(([m, w]) => [m, w[mood - 1]]))));
        }
        const hour = 8 + Math.floor(rand() * 14);
        checkins.student.push(id);
        checkins.career.push(ec);
        checkins.mood.push(moods[mood]);
        checkins.at.push(`${date.toISOString().slice(0, 10)} ${String(hour).padStart(2, "0")}:${String(Math.floor(rand() * 60)).padStart(2, "0")}:00 America/Santiago`);
        checkins.reasons.push([...chosen].map((m) => reasons[m]).filter(Boolean).join(","));
      }
      // PSS-10 cada ~30 días; el estrés sube hacia fin de semestre.
      const stress = 16 + careerMood * -4 + normal() * 7;
      // Cada estudiante tiene su propio día del ciclo, así hay tests en cualquier semana.
      const phase = Math.floor(rand() * 30);
      for (const d of [phase + 60, phase + 30, phase]) {
        if (rand() < 0.15) continue;
        const score = Math.min(40, Math.max(0, Math.round(stress + (DAYS - d) / DAYS * 8 + normal() * 3)));
        const date = new Date(today + "T12:00:00Z");
        date.setUTCDate(date.getUTCDate() - d);
        applications.student.push(id);
        applications.career.push(ec);
        applications.score.push(score);
        applications.level.push(levelOf(score));
        applications.at.push(date.toISOString().slice(0, 10) + " 19:00:00 America/Santiago");
      }
      // Algunas solicitudes de borrado: sus registros dejan de contar.
      const del = rand();
      if (share && del < 0.08) {
        summary.deletions++;
        await db.query(
          `insert into public.solicitud_eliminacion(estudiante_id_estudiante,tipo,solicitada_en,ejecutar_en)
           values($1,$2,now() - interval '2 days',now() + interval '5 days')`,
          [id, del < 0.04 ? "cuenta" : "datos"],
        );
      }
    }
  }
  const inserted = await db.query(
    `with input as (
       select * from unnest($1::bigint[], $2::bigint[], $3::bigint[], $4::timestamptz[], $5::text[])
         as t(student, career, mood, at, reasons)
     ),
     reg as (
       insert into public.registro_emocional(estudiante_id_estudiante,estudiante_carrera_id,emocion_general_id_emocion,fecha_hora,client_request_id)
       select student, career, mood, at, gen_random_uuid() from input
       returning id_registro, estudiante_id_estudiante, fecha_hora
     )
     insert into public.registro_emocional_motivo(registro_emocional_id_registro,motivo_id_motivo)
     select reg.id_registro, m::bigint
     from reg join input on input.student = reg.estudiante_id_estudiante and input.at = reg.fecha_hora,
          unnest(string_to_array(nullif(input.reasons, ''), ',')) m
     returning 1`,
    [checkins.student, checkins.career, checkins.mood, checkins.at, checkins.reasons],
  );
  summary.checkins = checkins.student.length;
  await db.query(
    `insert into public.aplicacion_test(estudiante_id_estudiante,estudiante_carrera_id,test_id,test_version,puntaje_total,nivel_resultado,fecha_hora)
     select student, career, $6, $7, score, level, at
     from unnest($1::bigint[], $2::bigint[], $3::int[], $4::text[], $5::timestamptz[]) as t(student, career, score, level, at)`,
    [applications.student, applications.career, applications.score, applications.level, applications.at, test.id, test.version],
  );
  summary.tests = applications.student.length;
  await db.query("commit");
  console.log(
    `Datos de demostración en ${where}: ${summary.students} estudiantes (${summary.sharing} comparten), ` +
      `${summary.checkins} check-ins con ${inserted.rowCount} motivos, ${summary.tests} tests PSS-10 y ` +
      `${summary.deletions} solicitudes de borrado.`,
  );
  }
} catch (e) {
  await db.query("rollback").catch(() => {});
  throw e;
} finally {
  await db.end();
}

// Borra solo lo creado por este script: los estudiantes `demo-*` con todas sus filas y las
// carreras «(demo)» que ningún otro estudiante usa. Las solicitudes de borrado, los motivos de cada
// registro y los límites de recuperación de contraseña caen en cascada.
async function removeDemo() {
  const demo = "select id_estudiante from public.estudiante where correo like 'demo-%@duocmind.example.test'";
  const count = async (sql) => (await db.query(sql)).rowCount;
  const checkins = await count(`delete from public.registro_emocional where estudiante_id_estudiante in (${demo})`);
  await db.query(`delete from public.alerta_bienestar where estudiante_id_estudiante in (${demo})`);
  const tests = await count(`delete from public.aplicacion_test where estudiante_id_estudiante in (${demo})`);
  await db.query(`delete from public.estudiante_consentimiento where estudiante_id_estudiante in (${demo})`);
  await db.query(`delete from public.estudiante_carrera where estudiante_id_estudiante in (${demo})`);
  const students = await count("delete from public.estudiante where correo like 'demo-%@duocmind.example.test'");
  const careers = await count(
    `delete from public.carrera c where nombre_carrera = any($1::text[])
       and not exists (select 1 from public.estudiante_carrera ec where ec.carrera_id_carrera = c.id_carrera)
       and not exists (select 1 from public.carrera_asignatura ca where ca.carrera_id_carrera = c.id_carrera)`.replace("$1::text[]", `array[${CAREERS.map(([n]) => `'${n.replace(/'/g, "''")}'`).join(",")}]`),
  );
  return { students, checkins, tests, careers };
}
