// Spec 023: dashboard de bienestar ampliado.
// Los datos sintéticos se crean dentro de una transacción que siempre termina en rollback,
// por lo que la base queda exactamente como estaba. Cada escenario vive en un savepoint.
import assert from "node:assert/strict";
import { authClient, database, fixtures, runtime } from "../scripts/runtime.mjs";

const f = fixtures(), r = runtime(), db = await database();
const api = (token, path) =>
  fetch(r.API_URL + "/functions/v1/admin-api/wellbeing/" + path, {
    headers: { ...(token ? { authorization: "Bearer " + token } : {}), apikey: r.ANON_KEY },
  });
const sessionOf = (token) => JSON.parse(Buffer.from(token.split(".")[1], "base64url")).session_id;
const SANTIAGO = "'America/Santiago'";
const PSS10 = "Escala de Estrés Percibido (PSS-10)";
// Mediodía (hora de Santiago) de hace n días.
const dayAt = (n) =>
  `((date_trunc('day', now() at time zone ${SANTIAGO}) - interval '${n} days' + interval '12 hours') at time zone ${SANTIAGO})`;
// Mediodía del lunes de la semana de hace k semanas (+ d días).
const weekAt = (k, d = 0) =>
  `((date_trunc('week', now() at time zone ${SANTIAGO}) - interval '${7 * k - d} days' + interval '12 hours') at time zone ${SANTIAGO})`;
const PERIOD = `(now() at time zone ${SANTIAGO})::date - 89, (now() at time zone ${SANTIAGO})::date`;

let seq = 0;

try {
  const staff = await authClient().auth.signInWithPassword({ email: f.staff.email, password: f.staff.password });
  assert(!staff.error, "login de la cuenta administradora sintética");
  const sessionId = sessionOf(staff.data.session.access_token);
  const student = await authClient().auth.signInWithPassword({ email: f.student.email, password: f.student.password });
  assert(!student.error);
  const studentSessionId = sessionOf(student.data.session.access_token);

  // CA-008 por HTTP: sin sesión de administrador se rechaza; la Edge valida la consulta.
  const token = staff.data.session.access_token;
  for (const path of ["summary", "reasons", "stress", "careers", "participation", "careers-available"]) {
    assert.equal((await api(null, path)).status, 401, path + " sin token");
    assert.equal((await api("token-invalido", path)).status, 401, path + " token inválido");
    assert.equal((await api(student.data.session.access_token, path)).status, 403, path + " estudiante");
    const ok = await api(token, path + "?days=7");
    assert.equal(ok.status, 200, path);
    assert.equal((await ok.json()).days, 7);
    for (const q of ["?days=15", "?days=7&days=7", "?extra=1"]) {
      assert.equal((await api(token, path + q)).status, 422, path + q);
    }
  }
  assert.equal((await api(token, "summary?careerId=0")).status, 422);
  assert.equal((await api(token, "summary?careerId=999999999")).status, 200, "carrera inexistente: sin 4xx");
  assert.equal((await api(token, "careers-available?careerId=1")).status, 422);

  await db.query("begin");
  // Línea base limpia dentro de la transacción (se revierte al final).
  await db.query("delete from public.registro_emocional_motivo");
  await db.query("delete from public.registro_emocional");
  await db.query("delete from public.aplicacion_test");
  await db.query("delete from public.solicitud_eliminacion");
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
    const id = (await db.query(
      "insert into public.estudiante(rut,primer_nombre,primer_apellido,correo) values($1,$2,$3,$4) returning id_estudiante",
      [`WB-RUT-${n}`, `Nombre${n}`, `Apellido${n}`, `wb${n}@duocmind.example.test`],
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
  async function checkin(id, value, at, reasons = []) {
    const reg = (await db.query(
      `insert into public.registro_emocional(estudiante_id_estudiante,emocion_general_id_emocion,fecha_hora,client_request_id)
       select $1,id_emocion,${at},gen_random_uuid() from public.emocion_general where valor_escala=$2
       returning id_registro`,
      [id, value],
    )).rows[0].id_registro;
    for (const name of reasons) {
      await db.query(
        `insert into public.registro_emocional_motivo(registro_emocional_id_registro,motivo_id_motivo)
         select $1,id_motivo from public.motivo where nombre_motivo=$2`,
        [reg, name],
      );
    }
  }
  const deletion = (id, tipo, at) =>
    db.query(
      `insert into public.solicitud_eliminacion(estudiante_id_estudiante,tipo,solicitada_en,ejecutar_en)
       values($1,$2,${at},${at} + interval '30 days')`,
      [id, tipo],
    );
  async function sharing(careerId = null) {
    const id = await makeStudent(careerId);
    await consent(id, "analitica_anonima", true, dayAt(120));
    return id;
  }
  // PSS-10 sintético: versión borrador con niveles que luego se publica y activa. La base
  // local no trae el instrumento validado; estos niveles no son el contenido real.
  async function pss10(version = 1, active = true) {
    const id = (await db.query(
      `insert into public.test_bienestar(nombre_test,tipo_test,version,puntaje_maximo,catalog_id,scoring_kind)
       select $1,'FIXTURE SINTÉTICA',$2,40,catalog_id,'pss10' from public.test_catalogo where code='pss10'
       returning id_test`,
      [PSS10, version],
    )).rows[0].id_test;
    for (const [level, min, max, label] of [["leve", 0, 13, "Estrés leve"], ["moderado", 14, 26, "Estrés moderado"], ["severo", 27, 40, "Estrés severo"]]) {
      await db.query(
        `insert into public.test_resultado_nivel(test_id,test_version,nivel_resultado,puntaje_minimo,puntaje_maximo,label)
         values($1,$2,$3,$4,$5,$6)`,
        [id, version, level, min, max, label],
      );
    }
    await db.query(
      "update public.test_bienestar set publication_status='published',published_at=now(),is_active=$2 where id_test=$1",
      [id, active],
    );
    return { id, version };
  }
  const levelOf = (score) => (score >= 27 ? "severo" : score >= 14 ? "moderado" : "leve");
  const apply = (id, test, score, at) =>
    db.query(
      `insert into public.aplicacion_test(estudiante_id_estudiante,test_id,test_version,puntaje_total,nivel_resultado,fecha_hora)
       values($1,$2,$3,$4,$5,${at})`,
      [id, test.id, test.version, score, levelOf(score)],
    );
  const checkins = async (career = null) =>
    (await db.query(
      `select sid::int, val, cid, cname, reasons from private.wellbeing_checkins(${PERIOD}, $1) order by sid, dy, val`,
      [career],
    )).rows;
  const tests = async (career = null) =>
    (await db.query(
      `select sid::int, score, level, label, is_high, cid from private.wellbeing_tests(${PERIOD}, $1) order by sid`,
      [career],
    )).rows;
  // Estudiantes que comparten, cada uno con un registro por valor en `values`.
  async function cohort(count, values, { careerId = null, at = dayAt(3), reasons = [] } = {}) {
    const ids = [];
    for (let i = 0; i < count; i++) {
      const id = await sharing(careerId);
      for (const v of values) await checkin(id, v, at, reasons);
      ids.push(id);
    }
    return ids;
  }
  const call = async (fn, ...args) =>
    (await db.query(`select private.${fn}(${args.map((_, i) => "$" + (i + 1)).join(",")}) d`, args)).rows[0].d;
  const suppress = async (cells) =>
    (await db.query("select private.suppress_row($1::jsonb) r", [JSON.stringify(cells)])).rows[0].r;

  await scenario("CA-004 consentimientos que cuentan", async () => {
    const ok = await sharing();
    await checkin(ok, 4, dayAt(3), ["Académico", "Familia"]);
    const onlyContact = await makeStudent();
    await consent(onlyContact, "contacto", true, dayAt(60));
    await checkin(onlyContact, 1, dayAt(3));
    const noRows = await makeStudent();
    await checkin(noRows, 1, dayAt(3));
    const refused = await makeStudent();
    await consent(refused, "analitica_anonima", false, dayAt(60));
    await checkin(refused, 1, dayAt(3));
    const revoked = await sharing();
    await checkin(revoked, 2, dayAt(5));
    await consent(revoked, "analitica_anonima", false, dayAt(1));
    // Solo cuenta lo registrado desde que se otorgó (límite inclusivo).
    const late = await makeStudent();
    await consent(late, "analitica_anonima", true, dayAt(10));
    await checkin(late, 5, dayAt(20));
    await checkin(late, 3, dayAt(10));
    const rows = await checkins();
    assert.deepEqual(rows.map((r) => [r.sid, r.val]), [[Number(ok), 4], [Number(late), 3]]);
    assert.deepEqual(rows[0].reasons, ["Familia", "Académico"], "motivos en el orden del catálogo");
    assert.deepEqual(rows[1].reasons, [], "sin motivos: arreglo vacío");
  });

  await scenario("CA-004 solicitudes de borrado", async () => {
    const account = await sharing();
    await checkin(account, 3, dayAt(5));
    await checkin(account, 3, dayAt(1));
    await deletion(account, "cuenta", dayAt(2));
    const data = await sharing();
    await checkin(data, 1, dayAt(5));
    await deletion(data, "datos", dayAt(3));
    await checkin(data, 5, dayAt(1));
    const rows = await checkins();
    assert.deepEqual(
      rows.map((r) => [r.sid, r.val]),
      [[Number(data), 5]],
      "cuenta: nada cuenta; datos: solo lo registrado después de la solicitud",
    );
  });

  await scenario("periodo y filtro de carrera", async () => {
    const a = await career("Carrera WB A"), b = await career("Carrera WB B");
    const inA = await sharing(a), inB = await sharing(b), none = await sharing();
    for (const id of [inA, inB, none]) {
      await checkin(id, 3, dayAt(0));
      await checkin(id, 3, dayAt(89));
      await checkin(id, 3, dayAt(90)); // fuera del periodo de 90 días
    }
    assert.equal((await checkins()).length, 6, "los extremos del periodo se incluyen");
    const onlyA = await checkins(a);
    assert.deepEqual([...new Set(onlyA.map((r) => r.sid))], [Number(inA)]);
    assert(onlyA.every((r) => Number(r.cid) === Number(a) && r.cname === "Carrera WB A"));
    assert.equal((await checkins(-1)).length, 0, "carrera inexistente: sin filas");
    // Cuenta la carrera vigente, no la anterior.
    await db.query("update public.estudiante_carrera set fecha_fin=current_date where estudiante_id_estudiante=$1", [inA]);
    await db.query("insert into public.estudiante_carrera(estudiante_id_estudiante,carrera_id_carrera) values($1,$2)", [inA, b]);
    assert.equal((await checkins(a)).length, 0);
    assert.equal((await checkins(b)).length, 4);
  });

  await scenario("CA-005 última aplicación del PSS-10 activo", async () => {
    await db.query("update public.test_bienestar set is_active=false, revision=revision+1 where nombre_test=$1 and is_active", [PSS10]);
    const test = await pss10(901);
    const old = await pss10(902, false);
    const a = await sharing(), b = await sharing(), c = await sharing();
    await apply(a, test, 30, dayAt(20));
    await apply(a, test, 10, dayAt(2)); // la más reciente manda
    await apply(b, test, 20, dayAt(5));
    await apply(c, old, 35, dayAt(4)); // versión inactiva: no cuenta
    const onlyContact = await makeStudent();
    await consent(onlyContact, "contacto", true, dayAt(60));
    await apply(onlyContact, test, 35, dayAt(3));
    const deleted = await sharing();
    await apply(deleted, test, 35, dayAt(3));
    await deletion(deleted, "datos", dayAt(1));
    const late = await makeStudent();
    await consent(late, "analitica_anonima", true, dayAt(3));
    await apply(late, test, 35, dayAt(4)); // anterior al consentimiento
    const high = await sharing();
    await apply(high, test, 27, dayAt(1));
    const rows = await tests();
    assert.deepEqual(
      rows.map((r) => [r.sid, r.score, r.level, r.is_high]),
      [[Number(a), 10, "leve", false], [Number(b), 20, "moderado", false], [Number(high), 27, "severo", true]],
      "una fila por estudiante, solo la versión activa y con consentimiento vigente",
    );
    assert.equal(rows[2].label, "Estrés severo", "etiqueta del servidor");
  });

  await scenario("suppress_row con 0, 1 y 2 celdas ocultas", async () => {
    assert.deepEqual(await suppress([{ n: 5, value: 25 }, { n: 0, value: 0 }, { n: 9, value: 75 }]), [25, 0, 75], "0 ocultas");
    assert.deepEqual(
      await suppress([{ n: 3, value: 10 }, { n: 8, value: 30 }, { n: 6, value: 20 }, { n: 0, value: 0 }, { n: 12, value: 40 }]),
      [null, 30, null, 0, 40],
      "1 oculta: también la visible con menos estudiantes (no la de 0)",
    );
    assert.deepEqual(
      await suppress([{ n: 6, value: 1 }, { n: 6, value: 2 }, { n: 2, value: 3 }]),
      [null, 2, null],
      "empate: la primera",
    );
    assert.deepEqual(
      await suppress([{ n: 1, value: 5 }, { n: 4, value: 15 }, { n: 7, value: 30 }, { n: 20, value: 50 }]),
      [null, null, 30, 50],
      "2 ocultas: no se oculta nada más",
    );
    assert.deepEqual(await suppress([]), []);
    assert.deepEqual(await suppress([{ n: 3, value: 100 }]), [null], "única celda oculta sin visibles");
  });

  const HEADER = ["careerId", "days", "from", "minGroupSize", "sufficient", "to"];
  const SUMMARY_KEYS = [...HEADER, "average", "checkins", "difficultShare", "highStressShare", "participants", "testTaken", "topReasons", "weekdays", "weekly"].sort();
  const KPIS = ["participants", "checkins", "average", "difficultShare", "testTaken", "highStressShare"];

  await scenario("T002 resumen bajo k", async () => {
    await cohort(4, [1, 2]);
    const d = await call("wellbeing_summary", 30, null);
    assert.deepEqual(Object.keys(d).sort(), SUMMARY_KEYS);
    assert.equal(d.sufficient, false);
    assert.equal(d.minGroupSize, 5);
    for (const k of KPIS) assert.deepEqual(d[k], { value: null, previous: null }, k);
    for (const k of ["weekly", "weekdays", "topReasons"]) assert.deepEqual(d[k], [], k);
    await assert.rejects(call("wellbeing_summary", 15, null), (e) => e.code === "P0422");
  });

  await scenario("T002 resumen: KPIs, variación y motivos", async () => {
    // Periodo actual: 6 estudiantes; 5 con [4, 4] y Académico, 1 con [1] (días difíciles: 1 estudiante).
    await cohort(5, [4, 4], { reasons: ["Académico"] });
    await cohort(1, [1], { reasons: ["Salud"] });
    let d = await call("wellbeing_summary", 30, null);
    assert.equal(d.sufficient, true);
    assert.deepEqual(d.participants, { value: 6, previous: null }, "CA-006: periodo anterior bajo k omite la variación");
    assert.deepEqual(d.checkins, { value: 11, previous: null });
    assert.equal(d.average.value, 3.7);
    assert.equal(d.difficultShare.value, null, "CA-001: 1 estudiante en días difíciles no se publica");
    assert.deepEqual(d.topReasons, [{ name: "Académico", share: 90.9 }], "Salud (1 estudiante) no aparece");
    assert.deepEqual(d.testTaken, { value: null, previous: null });
    // Periodo anterior (hace 31 a 60 días) con 5 estudiantes: ahora sí hay variación.
    await cohort(5, [2, 3], { at: dayAt(40) });
    await cohort(4, [2], {});
    d = await call("wellbeing_summary", 30, null);
    assert.deepEqual(d.participants, { value: 10, previous: 5 });
    assert.deepEqual(d.checkins, { value: 15, previous: 10 });
    assert.deepEqual(d.average, { value: 3.3, previous: 2.5 });
    assert.deepEqual(d.difficultShare, { value: 33.3, previous: 50 }, "5 estudiantes dentro y 5 fuera");
  });

  await scenario("T002 tendencia, distribución y días de la semana", async () => {
    // Semana de hace 2 semanas: 6 estudiantes con 4 el lunes y 3 con 1 el martes.
    await cohort(6, [4], { at: weekAt(2) });
    await cohort(3, [1], { at: weekAt(2, 1) });
    const d = await call("wellbeing_summary", 90, null);
    const week = d.weekly.find((w) => w.distribution.some((v) => v !== null));
    assert(week, "semana con datos");
    assert.equal(week.average, 3);
    assert.deepEqual(week.distribution, [null, 0, 0, null, 0], "CA-001 y supresión complementaria: 1 oculta arrastra la menor visible");
    assert(d.weekly.length >= 13 && d.weekly.length <= 14, "una entrada por semana del periodo");
    assert(d.weekly.filter((w) => w !== week).every((w) => w.average === null), "semanas sin datos: null");
    assert.deepEqual(d.weekdays.map((w) => w.day), [1, 2, 3, 4, 5, 6, 7]);
    assert.equal(d.weekdays[0].average, 4, "lunes con 6 estudiantes");
    assert.equal(d.weekdays[1].average, null, "martes con 3 estudiantes");
  });

  await scenario("T002 filtro y selector de carrera", async () => {
    const big = await career("Carrera WB Grande"), tiny = await career("Carrera WB Chica");
    await cohort(5, [5], { careerId: big });
    await cohort(4, [1], { careerId: tiny });
    const available = await call("wellbeing_careers_available", 30);
    assert.deepEqual(available.careers, [{ id: String(big), name: "Carrera WB Grande" }], "CA-002: solo carreras con 5 o más");
    assert.deepEqual(Object.keys(available).sort(), [...HEADER, "careers"].sort());
    const filtered = await call("wellbeing_summary", 30, big);
    assert.equal(filtered.careerId, String(big));
    assert.deepEqual(filtered.participants, { value: 5, previous: null });
    assert.equal(filtered.average.value, 5);
    const small = await call("wellbeing_summary", 30, tiny);
    assert.equal(small.sufficient, false, "carrera bajo k: sufficient false, sin datos");
    assert.deepEqual(small.participants, { value: null, previous: null });
    assert.equal((await call("wellbeing_summary", 30, 999999999)).sufficient, false, "carrera inexistente igual que bajo k");
  });

  await scenario("T003 motivos: ranking, matriz, tendencia y «Otros motivos»", async () => {
    await cohort(6, [2], { reasons: ["Académico"] });
    await cohort(5, [4], { reasons: ["Familia"] });
    await cohort(2, [3], { reasons: ["Salud"] });
    await cohort(1, [5], { reasons: ["Salud", "Trabajo"] });
    const d = await call("wellbeing_reasons", 30, null);
    assert.deepEqual(Object.keys(d).sort(), [...HEADER, "matrix", "ranking", "trend"].sort());
    assert.equal(d.sufficient, true);
    // «Otros» (Salud y Trabajo: 3 estudiantes) absorbe Familia, la visible más pequeña (CA-003),
    // y el check-in con dos motivos de «Otros» cuenta una sola vez.
    assert.deepEqual(d.ranking, [
      { name: "Académico", share: 42.9, average: 2 },
      { name: "Otros motivos", share: 57.1, average: 3.9 },
    ]);
    assert.deepEqual(d.matrix, [
      { name: "Académico", cells: [0, 100, 0, 0, 0] },
      { name: "Otros motivos", cells: [0, 0, null, 62.5, null] },
    ], "CA-001: celdas de 1 a 4 estudiantes ocultas");
    assert.equal(d.trend.length, 1, "«Otros motivos» no entra en la tendencia");
    assert.equal(d.trend[0].name, "Académico");
    assert.deepEqual(d.trend[0].weeks.filter((w) => w.share !== null).map((w) => w.share), [42.9]);
    const text = JSON.stringify(d);
    assert(!text.includes("Familia") && !text.includes("Salud") && !text.includes("Trabajo"));
  });

  await scenario("T003 motivos sin grupo resto pequeño", async () => {
    await cohort(5, [1], { reasons: ["Académico"] });
    await cohort(5, [5], { reasons: ["Familia"] });
    const d = await call("wellbeing_reasons", 30, null);
    assert.deepEqual(d.ranking.map((r) => [r.name, r.share, r.average]), [["Académico", 50, 1], ["Familia", 50, 5]]);
    assert.deepEqual(d.trend.map((t) => t.name), ["Académico", "Familia"]);
    assert.deepEqual((await call("wellbeing_reasons", 30, -1)).ranking, [], "bajo k: vacío");
  });

  await scenario("T003 estrés: niveles, tendencia y carreras", async () => {
    await db.query("update public.test_bienestar set is_active=false, revision=revision+1 where nombre_test=$1 and is_active", [PSS10]);
    const test = await pss10(903);
    const x = await career("Carrera WB X"), y = await career("Carrera WB Y");
    const scores = [[x, 5], [x, 5], [x, 5], [x, 5], [x, 5], [x, 20], [y, 30], [y, 30], [y, 30], [y, 30], [y, 30]];
    for (const [c, score] of scores) {
      const [id] = await cohort(1, [3], { careerId: c });
      await apply(id, test, score, dayAt(3));
    }
    const d = await call("wellbeing_stress", 30, null);
    assert.deepEqual(Object.keys(d).sort(), [...HEADER, "average", "careers", "highShare", "levels", "participants", "weekly"].sort());
    assert.deepEqual(d.participants, { value: 11, previous: null });
    assert.deepEqual(d.average, { value: 17.7, previous: null });
    assert.deepEqual(d.highShare, { value: 45.5, previous: null });
    assert.deepEqual(d.levels, [
      { level: "leve", label: "Estrés leve", students: null },
      { level: "moderado", label: "Estrés moderado", students: null },
      { level: "severo", label: "Estrés severo", students: 5 },
    ], "moderado (1) se oculta y arrastra a leve, la primera visible con menos estudiantes");
    const weeks = d.weekly.filter((w) => w.average !== null);
    assert.deepEqual(weeks.map((w) => [w.average, w.highShare]), [[17.7, 45.5]]);
    assert.deepEqual(d.careers, [
      { name: "Carrera WB X", average: 7.5, highShare: 0 },
      { name: "Carrera WB Y", average: 30, highShare: 100 },
    ]);
    const onlyY = await call("wellbeing_stress", 30, y);
    assert.deepEqual(onlyY.participants, { value: 5, previous: null }, "filtro de carrera");
  });

  await scenario("T003 estrés bajo k", async () => {
    await db.query("update public.test_bienestar set is_active=false, revision=revision+1 where nombre_test=$1 and is_active", [PSS10]);
    const test = await pss10(904);
    const ids = await cohort(6, [3]);
    for (const id of ids.slice(0, 4)) await apply(id, test, 30, dayAt(2));
    const d = await call("wellbeing_stress", 30, null);
    assert.equal(d.sufficient, true, "hay participantes de check-in");
    assert.deepEqual(d.participants, { value: null, previous: null }, "CA-001: 4 tests no se publican");
    assert.deepEqual(d.highShare, { value: null, previous: null });
    assert(d.levels.every((l) => l.students === null));
    assert(d.weekly.every((w) => w.average === null && w.highShare === null));
  });

  await scenario("T004 carreras con «Otras carreras»", async () => {
    const a = await career("Carrera WB A"), bc = await career("Carrera WB B"), c = await career("Carrera WB C");
    await cohort(6, [2], { careerId: a, reasons: ["Académico"] });
    await cohort(5, [4], { careerId: bc, reasons: ["Familia"] });
    await cohort(3, [5], { careerId: c });
    const d = await call("wellbeing_careers", 30, null);
    assert.deepEqual(Object.keys(d).sort(), [...HEADER, "rows"].sort());
    // C (3) queda en «Otras carreras», que absorbe B (la visible más pequeña): CA-003.
    assert.deepEqual(d.rows, [
      { name: "Carrera WB A", participants: 6, average: 2, difficultShare: 100, highStressShare: null, topReason: "Académico" },
      { name: "Otras carreras", participants: 8, average: 4.4, difficultShare: 0, highStressShare: null, topReason: "Familia" },
    ]);
    const text = JSON.stringify(d);
    assert(!text.includes("Carrera WB B") && !text.includes("Carrera WB C"));
    const onlyA = await call("wellbeing_careers", 30, a);
    assert.deepEqual(onlyA.rows.map((r) => r.name), ["Carrera WB A"], "con filtro, solo esa carrera");
    assert.equal((await call("wellbeing_careers", 30, c)).sufficient, false);
  });

  await scenario("T004 participación: solo totales", async () => {
    const registered = async () =>
      (await db.query(
        `select count(*)::int n, count(*) filter (where exists (
           select 1 from public.estudiante_consentimiento_actual eca join public.consentimiento co
             on co.id_consentimiento=eca.consentimiento_id_consentimiento
           where eca.estudiante_id_estudiante=e.id_estudiante and eca.otorgado and co.codigo='analitica_anonima'))::int s
         from public.estudiante e where not exists (select 1 from public.solicitud_eliminacion s
           where s.estudiante_id_estudiante=e.id_estudiante and s.tipo='cuenta')`,
      )).rows[0];
    const ids = await cohort(6, [3, 3]);
    for (let i = 0; i < 6; i++) await makeStudent(); // registrados que no comparten
    let expected = await registered();
    let d = await call("wellbeing_participation", 30, null);
    assert.deepEqual(Object.keys(d).sort(), [...HEADER, "active", "checkinsPerParticipant", "registered", "sharingShare", "weekly"].sort());
    assert.equal(d.registered, expected.n);
    assert.equal(d.sharingShare, Math.round((1000 * expected.s) / expected.n) / 10);
    assert.deepEqual(d.active, { value: 6, previous: null });
    assert.deepEqual(d.checkinsPerParticipant, { value: 2, previous: null });
    assert.deepEqual(d.weekly.filter((w) => w.active !== null).map((w) => w.active), [6]);
    await deletion(ids[0], "cuenta", dayAt(1));
    expected = await registered();
    d = await call("wellbeing_participation", 30, null);
    assert.equal(d.registered, expected.n, "quien pidió borrar su cuenta no cuenta");
    assert.deepEqual(d.active, { value: 5, previous: null });
    const tiny = await career("Carrera WB Mini");
    await cohort(4, [3], { careerId: tiny });
    const filtered = await call("wellbeing_participation", 30, tiny);
    assert.equal(filtered.sufficient, false, "carrera bajo k: sin datos");
    assert.equal(filtered.registered, null);
  });

  await scenario("T005 rutas /wellbeing en admin_read", async () => {
    const read = (path, query = {}, actor = f.staff.id, session = sessionId) =>
      db.query("select public.admin_read($1,$2,$3,$4::jsonb) d", [actor, session, path, JSON.stringify(query)]);
    const rejected = async (path, query, code, actor, session) => {
      await db.query("savepoint rejected");
      await assert.rejects(read(path, query, actor, session), (e) => e.code === code, path + " " + JSON.stringify(query));
      await db.query("rollback to savepoint rejected");
    };
    // Datos con nombres y RUT sintéticos que nunca deben aparecer en una respuesta (CA-007).
    await db.query("update public.test_bienestar set is_active=false, revision=revision+1 where nombre_test=$1 and is_active", [PSS10]);
    const test = await pss10(905);
    const a = await career("Carrera WB Rutas");
    const ids = await cohort(6, [2, 4], { careerId: a, reasons: ["Académico"] });
    for (const id of ids) await apply(id, test, 30, dayAt(2));
    const secrets = (await db.query(
      "select rut, primer_nombre, primer_apellido, correo, id_estudiante::text id from public.estudiante where id_estudiante = any($1)",
      [ids],
    )).rows.flatMap((r) => [r.rut, r.primer_nombre, r.primer_apellido, r.correo]);
    const paths = ["summary", "reasons", "stress", "careers", "participation"].map((t) => "/wellbeing/" + t);
    for (const path of [...paths, "/wellbeing/careers-available"]) {
      const d = (await read(path)).rows[0].d;
      assert.equal(d.days, 30, path + ": 30 días por defecto");
      const text = JSON.stringify(d);
      for (const value of secrets) assert(!text.includes(value), path + ": dato personal en la respuesta");
      assert(!/"(sid|rid|id_estudiante|rut|correo|email)"/.test(text), path + ": clave identificadora");
      for (const days of ["7", "90"]) assert.equal((await read(path, { days })).rows[0].d.days, Number(days));
      for (const days of ["15", "0", "abc", "", "007", "30 "]) await rejected(path, { days }, "P0422");
      await rejected(path, { days: "30", extra: "1" }, "P0422");
      await rejected(path, {}, "P0401", f.staff.id, crypto.randomUUID());
      await rejected(path, {}, "P0401", f.student.id, sessionId);
      await rejected(path, {}, "P0403", f.student.id, studentSessionId);
    }
    for (const path of paths) {
      const d = (await read(path, { careerId: String(a) })).rows[0].d;
      assert.equal(d.careerId, String(a));
      assert.equal(d.sufficient, true, path + " con carrera");
      for (const careerId of ["0", "-1", "1.5", "abc", "", "1e3", "99999999999999999999"]) {
        await rejected(path, { careerId }, "P0422");
      }
      assert.equal((await read(path, { careerId: "999999999" })).rows[0].d.sufficient, false, "carrera inexistente: sin 4xx");
    }
    await rejected("/wellbeing/careers-available", { careerId: String(a) }, "P0422");
    await rejected("/wellbeing/otra", {}, "P0404");
    const access = (await db.query("select public.admin_access($1,$2) d", [f.staff.id, sessionId])).rows[0].d;
    assert(access.capabilities.includes("wellbeing"), "capacidad wellbeing");
  });

  await scenario("permisos de las funciones privadas", async () => {
    const fns = (await db.query(
      `select p.oid::regprocedure::text fn from pg_proc p join pg_namespace n on n.oid=p.pronamespace
       where n.nspname='private' and (p.proname like 'wellbeing%' or p.proname='suppress_row') order by 1`,
    )).rows.map((r) => r.fn);
    assert(fns.length >= 3, "funciones del dashboard de bienestar");
    for (const fn of fns) {
      const grants = (await db.query(
        `select r, has_function_privilege(r, $1, 'execute') p from unnest(array['anon','authenticated','service_role']) r`,
        [fn],
      )).rows;
      assert.deepEqual(grants.map((g) => [g.r, g.p]), [["anon", false], ["authenticated", false], ["service_role", true]], fn);
    }
    const definers = (await db.query(
      `select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
       where n.nspname='private' and p.prosecdef`,
    )).rows;
    assert.deepEqual(definers, [], "private no tiene funciones security definer");
  });

  console.log("Bienestar: CA-001 a CA-008 verificados con datos sintéticos (revertidos).");
} finally {
  await db.query("rollback").catch(() => {});
  await db.end();
}
