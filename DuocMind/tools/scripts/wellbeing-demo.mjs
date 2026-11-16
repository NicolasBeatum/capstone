// Datos sintéticos para mirar el dashboard de bienestar (spec 023) en el Supabase local.
// Crea unos 60 estudiantes `demo-*` en 4 carreras, más una carrera con 3 para ver la agrupación
// en «Otras carreras», con 90 días de check-ins, motivos y tests PSS-10 con patrones
// reconocibles. Es idempotente: borra y recrea solo sus estudiantes. Nunca toca la nube:
// `runtime()` rechaza cualquier API_URL o DB_URL que no sea local antes de conectarse.
import { database, runtime } from "./runtime.mjs";

runtime();
const db = await database();

const PSS10 = "Escala de Estrés Percibido (PSS-10)";
const EMAIL = (n) => `demo-${String(n).padStart(3, "0")}@duocmind.example.test`;
const CAREERS = [
  ["Ingeniería en Informática (demo)", 18],
  ["Técnico en Enfermería (demo)", 16],
  ["Diseño Gráfico (demo)", 14],
  ["Contabilidad General (demo)", 12],
  ["Turismo (demo)", 3],
];
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
  const demo = "select id_estudiante from public.estudiante where correo like 'demo-%@duocmind.example.test'";
  await db.query(`delete from public.registro_emocional where estudiante_id_estudiante in (${demo})`);
  await db.query(`delete from public.aplicacion_test where estudiante_id_estudiante in (${demo})`);
  await db.query(`delete from public.alerta_bienestar where estudiante_id_estudiante in (${demo})`);
  await db.query(`delete from public.estudiante_consentimiento where estudiante_id_estudiante in (${demo})`);
  await db.query(`delete from public.estudiante_carrera where estudiante_id_estudiante in (${demo})`);
  await db.query(`delete from public.estudiante where correo like 'demo-%@duocmind.example.test'`);

  // PSS-10: se usa el activo; si la base local no lo tiene, se crea uno sintético solo con
  // niveles (leve 0–13, moderado 14–26, severo 27–40), sin preguntas.
  let test = (await db.query(
    "select id_test id, version from public.test_bienestar where nombre_test=$1 and is_active",
    [PSS10],
  )).rows[0];
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
  for (const [name, size] of CAREERS) {
    const careerId = (await db.query(
      "insert into public.carrera(nombre_carrera) values($1) on conflict(nombre_carrera) do update set nombre_carrera=excluded.nombre_carrera returning id_carrera",
      [name],
    )).rows[0].id_carrera;
    // Cada carrera tiene su propio tono para que la tabla comparativa muestre diferencias.
    const careerMood = { 0: -0.2, 1: 0.1, 2: 0.3, 3: -0.4, 4: 0 }[CAREERS.findIndex((c) => c[0] === name)];
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
      const share = r < 0.6, contact = !share && r < 0.8;
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
      const base = 3.45 + careerMood + normal() * 0.45;
      const frequency = 0.35 + rand() * 0.45;
      for (let d = DAYS - 1; d >= 0; d--) {
        if (rand() > frequency) continue;
        const date = new Date(today + "T12:00:00Z");
        date.setUTCDate(date.getUTCDate() - d);
        const weekday = date.getUTCDay(); // 0 domingo, 1 lunes
        const progress = (DAYS - 1 - d) / (DAYS - 1); // 0 al inicio, 1 hoy
        const effect = (weekday === 1 ? -0.8 : 0) + (weekday === 0 || weekday === 6 ? 0.35 : 0) - progress * 0.5;
        const mood = Math.min(5, Math.max(1, Math.round(base + effect + normal() * 0.75)));
        const chosen = new Set();
        const count = rand() < 0.25 ? 0 : rand() < 0.7 ? 1 : 2;
        for (let k = 0; k < count; k++) {
          chosen.add(pick(mood <= 2
            ? { "Académico": 6, "Económico": 2, "Salud": 1.5, "Familia": 1, "Trabajo": 1, "Pareja": 0.5 }
            : { "Amistades": 3, "Familia": 3, "Académico": 1.5, "Pareja": 1.5, "Salud": 1, "Trabajo": 1, "Otro": 0.5 }));
        }
        const hour = 8 + Math.floor(rand() * 14);
        checkins.student.push(id);
        checkins.career.push(ec);
        checkins.mood.push(moods[mood]);
        checkins.at.push(`${date.toISOString().slice(0, 10)} ${String(hour).padStart(2, "0")}:${String(Math.floor(rand() * 60)).padStart(2, "0")}:00 America/Santiago`);
        checkins.reasons.push([...chosen].map((m) => reasons[m]).filter(Boolean).join(","));
      }
      // PSS-10 cada ~30 días; el estrés sube hacia fin de semestre.
      const stress = 11 + careerMood * -8 + normal() * 8;
      for (const center of [76, 46, 16]) {
        if (rand() < 0.2) continue;
        const d = Math.max(0, center + Math.floor(rand() * 25) - 12);
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
    `Datos de demostración locales: ${summary.students} estudiantes (${summary.sharing} comparten), ` +
      `${summary.checkins} check-ins con ${inserted.rowCount} motivos, ${summary.tests} tests PSS-10 y ` +
      `${summary.deletions} solicitudes de borrado.`,
  );
} catch (e) {
  await db.query("rollback").catch(() => {});
  throw e;
} finally {
  await db.end();
}
