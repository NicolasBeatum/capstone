// Spec 016, CA-004 a CA-011: dashboard emocional agregado.
// Los datos sintéticos se crean dentro de una transacción que siempre termina en rollback,
// por lo que la base queda exactamente como estaba. Cada escenario vive en un savepoint.
import assert from "node:assert/strict";
import { authClient, database, fixtures, runtime } from "../scripts/runtime.mjs";

const f = fixtures(), r = runtime(), db = await database();
const client = authClient();
const api = (token, path = "") =>
  fetch(r.API_URL + "/functions/v1/admin-api/emotions" + path, {
    headers: { ...(token ? { authorization: "Bearer " + token } : {}), apikey: r.ANON_KEY },
  });

const DASHBOARD_KEYS = [
  "average", "careers", "checkins", "days", "distribution", "from", "minGroupSize",
  "participants", "sufficient", "to", "weekly",
];
const SANTIAGO = "'America/Santiago'";
// Mediodía (hora de Santiago) de hace n días / de la semana de hace k semanas.
const dayAt = (n) =>
  `((date_trunc('day', now() at time zone ${SANTIAGO}) - interval '${n} days' + interval '12 hours') at time zone ${SANTIAGO})`;
const weekAt = (k) =>
  `((date_trunc('week', now() at time zone ${SANTIAGO}) - interval '${7 * k} days' + interval '12 hours') at time zone ${SANTIAGO})`;
const avg = (values) => Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;

let seq = 0;
const tokens = []; // nombres, RUT y correos sintéticos que nunca deben salir en la respuesta

try {
  const login = await client.auth.signInWithPassword({ email: f.staff.email, password: f.staff.password });
  assert(!login.error, "login de la cuenta administradora sintética");
  const token = login.data.session.access_token;
  const sessionId = JSON.parse(Buffer.from(token.split(".")[1], "base64url")).session_id;

  // CA-011: sin sesión de administrador se rechaza (HTTP) y los parámetros inválidos dan 422.
  assert.equal((await api(null)).status, 401, "CA-011: sin token");
  assert.equal((await api("token-invalido")).status, 401, "CA-011: token inválido");
  const student = await authClient().auth.signInWithPassword({ email: f.student.email, password: f.student.password });
  assert(!student.error);
  assert.equal((await api(student.data.session.access_token)).status, 403, "CA-011: cuenta de estudiante");
  const studentSessionId = JSON.parse(Buffer.from(student.data.session.access_token.split(".")[1], "base64url")).session_id;
  for (const query of ["?days=15", "?days=abc", "?days=", "?days=07", "?days=7&days=7", "?days=30&extra=1", "?other=1"]) {
    assert.equal((await api(token, query)).status, 422, "días inválidos o campos extra: " + query);
  }
  for (const query of ["", "?days=7", "?days=30", "?days=90"]) {
    const response = await api(token, query);
    assert.equal(response.status, 200, "consulta válida " + query);
    const body = await response.json();
    assert.deepEqual(Object.keys(body).sort(), DASHBOARD_KEYS);
    assert.equal(body.days, query ? Number(query.slice(6)) : 30);
  }

  await db.query("begin");
  // Línea base limpia dentro de la transacción (se revierte al final).
  await db.query("delete from public.registro_emocional");
  await db.query("delete from public.estudiante_consentimiento");

  async function scenario(name, run) {
    await db.query("savepoint scenario");
    try {
      await run();
    } catch (e) {
      e.message = "[" + name + "] " + e.message;
      throw e;
    } finally {
      await db.query("rollback to savepoint scenario");
      await db.query("release savepoint scenario");
    }
  }
  async function career(name) {
    return (await db.query(
      "insert into public.carrera(nombre_carrera) values($1) returning id_carrera",
      [name],
    )).rows[0].id_carrera;
  }
  async function makeStudent(careerId = null) {
    const n = ++seq;
    const t = { rut: `EMO-RUT-${n}-ZQX`, name: `Nombre${n}Zqx`, last: `Apellido${n}Zqx`, mail: `emo${n}.zqx@duocmind.example.test` };
    tokens.push(...Object.values(t));
    const id = (await db.query(
      "insert into public.estudiante(rut,primer_nombre,primer_apellido,correo) values($1,$2,$3,$4) returning id_estudiante",
      [t.rut, t.name, t.last, t.mail],
    )).rows[0].id_estudiante;
    if (careerId) {
      await db.query(
        "insert into public.estudiante_carrera(estudiante_id_estudiante,carrera_id_carrera) values($1,$2)",
        [id, careerId],
      );
    }
    return id;
  }
  const consent = (id, code, granted, at) =>
    db.query(
      `insert into public.estudiante_consentimiento(estudiante_id_estudiante,consentimiento_id_consentimiento,otorgado,version,registrado_en)
       select $1,id_consentimiento,$2,'v1',${at} from public.consentimiento where codigo=$3`,
      [id, granted, code],
    );
  const checkin = (id, value, at) =>
    db.query(
      `insert into public.registro_emocional(estudiante_id_estudiante,emocion_general_id_emocion,fecha_hora,client_request_id)
       select $1,id_emocion,${at},gen_random_uuid() from public.emocion_general where valor_escala=$2`,
      [id, value],
    );
  // Estudiantes con analitica_anonima otorgada hace 60 días y un registro por valor en `values`.
  async function cohort(count, values, { careerId = null, at = dayAt(3) } = {}) {
    const ids = [];
    for (let i = 0; i < count; i++) {
      const id = await makeStudent(careerId);
      await consent(id, "analitica_anonima", true, dayAt(60));
      for (const v of values) await checkin(id, v, at);
      ids.push(id);
    }
    return ids;
  }
  const dash = async (days = 30) =>
    (await db.query("select private.emotion_dashboard($1) d", [days])).rows[0].d;
  const insufficient = (d) => {
    assert.equal(d.sufficient, false);
    assert.deepEqual(Object.keys(d).sort(), DASHBOARD_KEYS);
    for (const k of ["participants", "checkins", "average"]) assert.equal(d[k], null, k);
    for (const k of ["distribution", "weekly", "careers"]) assert.deepEqual(d[k], [], k);
  };

  await scenario("estructura y distribución", async () => {
    await cohort(5, [1, 3, 3, 5]);
    const d = await dash(30);
    assert.equal(d.sufficient, true);
    assert.equal(d.minGroupSize, 5);
    assert.equal(d.participants, 5);
    assert.equal(d.checkins, 20);
    assert.equal(d.average, 3);
    assert.deepEqual(
      d.distribution,
      [
        { value: 1, label: "Muy mal", checkins: 5 },
        { value: 2, label: "Mal", checkins: 0 },
        { value: 3, label: "Neutro", checkins: 10 },
        { value: 4, label: "Bien", checkins: 0 },
        { value: 5, label: "Muy bien", checkins: 5 },
      ],
      "los 5 niveles aparecen, también con 0",
    );
    const today = (await db.query(`select (now() at time zone ${SANTIAGO})::date::text t`)).rows[0];
    assert.equal(d.to, today.t);
    assert.equal(d.days, 30);
  });

  await scenario("CA-004 contacto o sin filas no cuenta", async () => {
    await cohort(5, [4, 4]);
    const onlyContact = await makeStudent();
    await consent(onlyContact, "contacto", true, dayAt(60));
    await checkin(onlyContact, 1, dayAt(3));
    const noRows = await makeStudent();
    await checkin(noRows, 1, dayAt(3));
    const explicitNo = await makeStudent();
    await consent(explicitNo, "analitica_anonima", false, dayAt(60));
    await checkin(explicitNo, 1, dayAt(3));
    const d = await dash(30);
    assert.equal(d.participants, 5, "CA-004: solo cuentan quienes otorgaron analitica_anonima");
    assert.equal(d.checkins, 10);
    assert.equal(d.average, 4, "los valores 1 de los excluidos no entran al promedio");
  });

  await scenario("CA-005 revocar excluye", async () => {
    await cohort(5, [4]);
    const [leaver] = await cohort(1, [2, 2]);
    let d = await dash(30);
    assert.equal(d.participants, 6);
    assert.equal(d.checkins, 7);
    await consent(leaver, "analitica_anonima", false, dayAt(1));
    d = await dash(30);
    assert.equal(d.participants, 5, "CA-005: la revocación excluye en la siguiente lectura");
    assert.equal(d.checkins, 5, "se excluyen todos sus registros, también los previos a la revocación");
    assert.equal(d.average, 4);
  });

  await scenario("CA-006 registros previos al consentimiento", async () => {
    // Cinco estudiantes consienten hace 10 días: su registro de hace 20 días no cuenta.
    for (let i = 0; i < 5; i++) {
      const id = await makeStudent();
      await consent(id, "analitica_anonima", true, dayAt(10));
      await checkin(id, 5, dayAt(20));
      await checkin(id, 3, dayAt(5));
    }
    let d = await dash(90);
    assert.equal(d.participants, 5);
    assert.equal(d.checkins, 5, "CA-006: solo los registros posteriores al consentimiento");
    assert.equal(d.average, 3);
    // Quien solo tiene registros previos no cuenta como participante.
    const onlyBefore = await makeStudent();
    await consent(onlyBefore, "analitica_anonima", true, dayAt(10));
    await checkin(onlyBefore, 1, dayAt(20));
    d = await dash(90);
    assert.equal(d.participants, 5, "CA-006: quien solo registró antes no cuenta");
    // El límite es inclusivo: un registro en el mismo instante del consentimiento cuenta.
    const boundary = await makeStudent();
    await consent(boundary, "analitica_anonima", true, dayAt(8));
    await checkin(boundary, 3, dayAt(8));
    d = await dash(90);
    assert.equal(d.participants, 6);
    assert.equal(d.checkins, 6);
  });

  await scenario("reconsentimiento", async () => {
    const [a] = await cohort(1, []);
    // Otorgó hace 60 días (cohort), revocó hace 30, volvió a otorgar hace 20.
    await checkin(a, 5, dayAt(40)); // consentimiento previo a la revocación: no cuenta tras revocar y reotorgar
    await consent(a, "analitica_anonima", false, dayAt(30));
    await checkin(a, 5, dayAt(25)); // durante la revocación: no cuenta
    await consent(a, "analitica_anonima", true, dayAt(20));
    await checkin(a, 3, dayAt(15)); // posterior al último otorgamiento: cuenta
    await checkin(a, 3, dayAt(5)); // cuenta
    await cohort(4, [3], { at: dayAt(4) });
    const d = await dash(90);
    assert.equal(d.participants, 5);
    assert.equal(d.checkins, 6, "reconsentimiento: solo cuentan los posteriores al último otorgamiento (2 de a + 4)");
    assert.equal(d.average, 3, "los valores 5 anteriores al último otorgamiento no entran");
    // Revocar otra vez excluye todo lo suyo.
    await consent(a, "analitica_anonima", false, dayAt(1));
    insufficient(await dash(90));
  });

  await scenario("CA-007 cuatro versus cinco", async () => {
    // Cuatro estudiantes con tres registros cada uno: 12 registros, 4 estudiantes distintos.
    const ids = await cohort(4, [2, 3, 4]);
    insufficient(await dash(30));
    insufficient(await dash(7));
    insufficient(await dash(90));
    const fifth = await makeStudent();
    await consent(fifth, "analitica_anonima", true, dayAt(60));
    await checkin(fifth, 4, dayAt(3));
    const d = await dash(30);
    assert.equal(d.sufficient, true, "CA-007: con 5 estudiantes sí hay agregados");
    assert.equal(d.participants, 5, "participantes son estudiantes distintos, no registros");
    assert.equal(d.checkins, 13);
    assert.equal(d.average, avg([...Array(4).fill([2, 3, 4]).flat(), 4]));
    assert.equal(ids.length, 4);
  });

  await scenario("CA-008 carrera pequeña no aparece ni se deduce", async () => {
    const A = await career("Carrera A sintética");
    const B = await career("Carrera B sintética");
    const C = await career("Carrera C sintética");
    await cohort(6, [4], { careerId: A });
    await cohort(3, [1, 2], { careerId: B });
    await cohort(5, [5], { careerId: C });
    let d = await dash(30);
    const names = d.careers.map((c) => c.name);
    assert(!names.includes("Carrera B sintética"), "CA-008: la carrera de 3 no aparece por separado");
    assert(!names.includes("Carrera C sintética"), "la carrera visible más pequeña se suma a «Otras carreras»");
    assert.deepEqual(names, ["Carrera A sintética", "Otras carreras"]);
    const visible = d.careers.filter((c) => c.name !== "Otras carreras");
    const deduced = d.participants - visible.reduce((s, c) => s + c.participants, 0);
    assert.equal(d.participants, 14);
    assert.equal(deduced, 8, "total menos visibles = «Otras carreras» (8), nunca 3");
    assert.equal(d.careers[1].participants, 8);
    assert.notEqual(deduced, 3);
    // Promedios recalculados sobre los registros reales del grupo.
    assert.equal(d.careers[0].average, 4);
    assert.equal(d.careers[1].average, avg([...Array(3).fill([1, 2]).flat(), ...Array(5).fill(5)]));

    // Sin carrera vigente: 3 + 2 sin carrera = 5, «Otras carreras» llega al mínimo sin absorber.
    await cohort(2, [3]);
    d = await dash(30);
    assert.deepEqual(d.careers.map((c) => c.name), [
      "Carrera A sintética", "Carrera C sintética", "Otras carreras",
    ], "orden alfabético con «Otras carreras» al final, sin ranking");
    assert.equal(d.careers[2].participants, 5);
    assert.equal(d.participants - d.careers[0].participants - d.careers[1].participants, 5);
    assert.equal(d.careers[2].average, avg([...Array(3).fill([1, 2]).flat(), 3, 3]));

    // Carrera cerrada (fecha_fin): se usa la vigente, no el historial.
    const mover = await makeStudent(B);
    await consent(mover, "analitica_anonima", true, dayAt(60));
    await checkin(mover, 4, dayAt(3));
    await db.query("update public.estudiante_carrera set fecha_fin=current_date where estudiante_id_estudiante=$1", [mover]);
    await db.query("insert into public.estudiante_carrera(estudiante_id_estudiante,carrera_id_carrera) values($1,$2)", [mover, A]);
    d = await dash(30);
    assert.equal(d.careers.find((c) => c.name === "Carrera A sintética").participants, 7, "cuenta en la carrera vigente");
  });

  await scenario("CA-008 una sola carrera visible más «Otras»", async () => {
    // A=5, C=5 y B=3: B (3) absorbe a la visible más pequeña por nombre (A, empate en 5).
    const A = await career("Carrera A sintética");
    const B = await career("Carrera B sintética");
    const C = await career("Carrera C sintética");
    await cohort(5, [3], { careerId: A });
    await cohort(3, [1], { careerId: B });
    await cohort(5, [5], { careerId: C });
    const d = await dash(30);
    assert.deepEqual(d.careers.map((c) => [c.name, c.participants]), [
      ["Carrera C sintética", 5], ["Otras carreras", 8],
    ]);
    // Lógica de diferencia: total (13) − visible (5) = 8 = «Otras»; ningún grupo menor a 5 es deducible.
    assert.equal(d.participants - 5, 8);
    assert.equal(d.careers[1].average, avg([...Array(5).fill(3), ...Array(3).fill(1)]));
  });

  await scenario("CA-008 desglose omitido", async () => {
    // Todos sin carrera: el único grupo repetiría el total, se omite.
    await cohort(5, [3]);
    let d = await dash(30);
    assert.equal(d.sufficient, true);
    assert.deepEqual(d.careers, []);
    // Una carrera de 5 y otra de 3: la pequeña absorbe a la única visible; queda un solo grupo = total,
    // decisión documentada: no hay desglose.
    const A = await career("Carrera A sintética");
    const B = await career("Carrera B sintética");
    await db.query("delete from public.registro_emocional");
    await cohort(5, [3], { careerId: A });
    await cohort(3, [1], { careerId: B });
    d = await dash(30);
    assert.equal(d.participants, 8);
    assert.deepEqual(d.careers, [], "sin carreras visibles el desglose se omite");
    // Todas las carreras visibles: sin «Otras carreras».
    await cohort(2, [2], { careerId: B });
    d = await dash(30);
    assert.deepEqual(d.careers.map((c) => [c.name, c.participants]), [
      ["Carrera A sintética", 5], ["Carrera B sintética", 5],
    ]);
  });

  await scenario("CA-009 semana con menos de 5", async () => {
    const week = async (k) => (await db.query(`select (date_trunc('week', ${weekAt(k)} at time zone ${SANTIAGO}))::date::text w`)).rows[0].w;
    const students = await cohort(5, [], {});
    // Semana actual: 5 estudiantes. Semana -1: 3. Semana -2: 5. Semana -3: ninguno.
    for (const id of students) await checkin(id, 4, weekAt(0));
    for (const id of students.slice(0, 3)) {
      await checkin(id, 2, weekAt(1));
      await checkin(id, 2, weekAt(1));
    }
    for (const id of students) await checkin(id, 3, weekAt(2));
    const d = await dash(30);
    const byWeek = Object.fromEntries(d.weekly.map((w) => [w.weekStart, w]));
    assert.deepEqual(byWeek[await week(0)], { weekStart: await week(0), participants: 5, average: 4 });
    assert.deepEqual(byWeek[await week(1)], { weekStart: await week(1), participants: null, average: null },
      "CA-009: 3 estudiantes (6 registros) no entregan valores");
    assert.deepEqual(byWeek[await week(2)], { weekStart: await week(2), participants: 5, average: 3 });
    assert.deepEqual(byWeek[await week(3)], { weekStart: await week(3), participants: null, average: null },
      "una semana sin datos es vacío (null), nunca 0");
    // Semanas consecutivas, de la semana de `from` a la actual, siempre lunes.
    const starts = d.weekly.map((w) => w.weekStart);
    assert.equal(starts.at(-1), await week(0));
    const gaps = await db.query(
      "select count(*)::int n from unnest($1::date[]) with ordinality t(d,i) where extract(isodow from d)<>1",
      [starts],
    );
    assert.equal(gaps.rows[0].n, 0, "weekStart siempre es lunes");
    for (let i = 1; i < starts.length; i++) {
      assert.equal((Date.parse(starts[i]) - Date.parse(starts[i - 1])) / 86400000, 7);
    }
    assert(Date.parse(starts[0]) <= Date.parse(d.from));
    assert(Date.parse(d.from) - Date.parse(starts[0]) < 7 * 86400000);
    for (const w of d.weekly) {
      assert.deepEqual(Object.keys(w).sort(), ["average", "participants", "weekStart"]);
      assert.equal(w.participants === null, w.average === null);
    }
  });

  await scenario("CA-010 sin identificadores", async () => {
    const A = await career("Carrera A sintética");
    const B = await career("Carrera B sintética");
    await cohort(6, [1, 2, 3, 4, 5], { careerId: A });
    await cohort(3, [2], { careerId: B });
    await cohort(1, [3]);
    const wrapped = (await db.query(
      "select public.admin_read($1,$2,'/emotions','{\"days\":\"30\"}'::jsonb) d",
      [f.staff.id, sessionId],
    )).rows[0].d;
    assert.deepEqual(wrapped, await dash(30), "admin_read entrega lo mismo que la función");
    const allowed = {
      root: DASHBOARD_KEYS,
      distribution: ["checkins", "label", "value"],
      weekly: ["average", "participants", "weekStart"],
      careers: ["average", "name", "participants"],
    };
    const walk = (node, path = "root") => {
      if (Array.isArray(node)) return node.forEach((n) => walk(n, path));
      if (node && typeof node === "object") {
        const expected = allowed[path];
        assert(expected, "objeto inesperado en " + path);
        assert.deepEqual(Object.keys(node).sort(), expected, "claves en " + path);
        for (const [k, v] of Object.entries(node)) walk(v, allowed[k] ? k : path + "." + k);
        return;
      }
      if (typeof node === "string") {
        for (const t of tokens) {
          assert(!node.toLowerCase().includes(t.toLowerCase()), "CA-010: valor con dato sintético");
        }
      }
    };
    walk(wrapped);
    const text = JSON.stringify(wrapped).toLowerCase();
    for (const t of tokens) assert(!text.includes(t.toLowerCase()), "CA-010: " + t.slice(0, 6) + " aparece en la respuesta");
    assert(!/(rut|correo|email|@|zqx)/.test(text));
    assert(tokens.length >= 10);
  });

  await scenario("CA-011 y días en admin_read", async () => {
    const call = (query, actor = f.staff.id, session = sessionId) =>
      db.query("select public.admin_read($1,$2,'/emotions',$3::jsonb) d", [actor, session, JSON.stringify(query)]);
    const rejected = async (query, code, actor, session) => {
      await db.query("savepoint rejected");
      await assert.rejects(call(query, actor, session), (e) => e.code === code, JSON.stringify(query));
      await db.query("rollback to savepoint rejected");
    };
    assert.equal((await call({})).rows[0].d.days, 30, "default 30");
    for (const days of ["7", "30", "90"]) assert.equal((await call({ days })).rows[0].d.days, Number(days));
    for (const days of ["15", "0", "-7", "abc", "", "30.0", "7 ", "007"]) await rejected({ days }, "P0422");
    await rejected({ days: "30", other: "1" }, "P0422");
    await rejected({ other: "1" }, "P0422");
    // Sin sesión de administrador: la función rechaza antes de calcular.
    await rejected({}, "P0401", f.staff.id, crypto.randomUUID());
    await rejected({}, "P0401", f.student.id, sessionId); // sesión ajena
    await rejected({}, "P0403", f.student.id, studentSessionId); // sesión válida sin permiso
    // La función privada exige un periodo permitido y no la ejecutan los roles de la API.
    await db.query("savepoint rejected");
    await assert.rejects(dash(15), (e) => e.code === "P0422");
    await db.query("rollback to savepoint rejected");
    const grants = (await db.query(
      `select r, has_function_privilege(r, 'private.emotion_dashboard(int)', 'execute') p
       from unnest(array['anon','authenticated','service_role']) r`,
    )).rows;
    assert.deepEqual(grants.map((g) => [g.r, g.p]), [["anon", false], ["authenticated", false], ["service_role", true]]);
  });

  console.log("Dashboard emocional: CA-004 a CA-011 verificados con datos sintéticos (revertidos).");
} finally {
  await db.query("rollback").catch(() => {});
  await db.end();
}
