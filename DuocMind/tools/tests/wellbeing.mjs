// Spec 023: dashboard de bienestar ampliado.
// Los datos sintéticos se crean dentro de una transacción que siempre termina en rollback,
// por lo que la base queda exactamente como estaba. Cada escenario vive en un savepoint.
import assert from "node:assert/strict";
import { database } from "../scripts/runtime.mjs";

const db = await database();
const SANTIAGO = "'America/Santiago'";
const PSS10 = "Escala de Estrés Percibido (PSS-10)";
// Mediodía (hora de Santiago) de hace n días.
const dayAt = (n) =>
  `((date_trunc('day', now() at time zone ${SANTIAGO}) - interval '${n} days' + interval '12 hours') at time zone ${SANTIAGO})`;
const PERIOD = `(now() at time zone ${SANTIAGO})::date - 89, (now() at time zone ${SANTIAGO})::date`;

let seq = 0;

try {
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

  await scenario("permisos de las funciones privadas", async () => {
    const fns = ["private.wellbeing_checkins(date,date,bigint)", "private.wellbeing_tests(date,date,bigint)", "private.suppress_row(jsonb)"];
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

  console.log("Bienestar: base filtrada (CA-004, CA-005) y supresión complementaria verificadas con datos sintéticos (revertidos).");
} finally {
  await db.query("rollback").catch(() => {});
  await db.end();
}
