import assert from "node:assert/strict";
import crypto from "node:crypto";
import { authClient, database, fixtures } from "../scripts/runtime.mjs";
const f = fixtures();
const auth = authClient();
const login = await auth.auth.signInWithPassword({
  email: f.staff.email,
  password: f.staff.password,
});
assert(!login.error);
const session = JSON.parse(
  Buffer.from(login.data.session.access_token.split(".")[1], "base64url"),
).session_id;
const db = await database();
try {
  await db.query("begin");
  await db.query("set local role service_role");
  const call = async (method, path, payload) =>
    (await db.query("select public.admin_mutate($1,$2,$3,$4,$5) result", [
      f.staff.id,
      session,
      method,
      path,
      payload,
    ])).rows[0].result;
  const payload = {
    requestId: crypto.randomUUID(),
    title: "Cuestionario sintético",
    description: "Orientación no diagnóstica",
    questions: [{
      text: "Pregunta sintética",
      helper: "",
      options: [{ text: "Nunca", score: 0 }, { text: "A veces", score: 1 }],
    }],
    levels: [{
      key: "orientacion",
      label: "Orientación",
      content: "Recurso general",
      min: 0,
      max: 1,
    }],
  };
  const draft = await call("POST", "/tests", payload);
  assert.equal(typeof draft.versionId, "string");
  assert.deepEqual(await call("POST", "/tests", payload), draft);
  const reject = async (fn, code) => {
    await db.query("savepoint negative");
    await assert.rejects(fn, (e) => e.code === code);
    await db.query("rollback to savepoint negative");
  };
  await reject(
    () => call("POST", "/tests", { ...payload, title: "Otro título" }),
    "P0409",
  );
  const path = "/tests/versions/" + draft.versionId;
  await reject(
    () =>
      call("POST", path + "/activation", {
        requestId: crypto.randomUUID(),
        expectedRevision: 1,
        active: true,
      }),
    "P0422",
  );
  const published = await call("POST", path + "/publish", {
    requestId: crypto.randomUUID(),
    expectedRevision: 1,
  });
  assert.equal(published.revision, 2);
  assert.equal(
    (await db.query(
      "select is_active from public.test_bienestar where id_test=$1",
      [draft.versionId],
    )).rows[0].is_active,
    false,
  );
  const active = await call("POST", path + "/activation", {
    requestId: crypto.randomUUID(),
    expectedRevision: 2,
    active: true,
  });
  assert.equal(active.revision, 3);
  await reject(
    () =>
      call("PUT", path + "/draft", {
        ...payload,
        requestId: crypto.randomUUID(),
        expectedRevision: 3,
      }),
    "P0422",
  );
  const cloned = await call("POST", path + "/clone", {
    requestId: crypto.randomUUID(),
    expectedRevision: 3,
  });
  assert.notEqual(cloned.versionId, draft.versionId);
  await call("POST", "/tests/versions/" + cloned.versionId + "/publish", {
    requestId: crypto.randomUUID(),
    expectedRevision: 1,
  });
  assert.equal(
    (await db.query(
      "select is_active from public.test_bienestar where id_test=$1",
      [draft.versionId],
    )).rows[0].is_active,
    true,
  );
  await call("POST", "/tests/versions/" + cloned.versionId + "/activation", {
    requestId: crypto.randomUUID(),
    expectedRevision: 2,
    active: true,
  });
  assert.equal(
    (await db.query(
      "select count(*)::int n from public.test_bienestar where catalog_id=$1 and is_active",
      [draft.catalogId],
    )).rows[0].n,
    1,
  );
  assert.equal(
    (await db.query(
      "select is_active from public.test_bienestar where id_test=$1",
      [draft.versionId],
    )).rows[0].is_active,
    false,
  );
  await reject(
    () =>
      call("POST", path + "/activation", {
        requestId: crypto.randomUUID(),
        expectedRevision: 3,
        active: true,
      }),
    "P0409",
  );
  const tip = await call("POST", "/tips", {
    requestId: crypto.randomUUID(),
    title: "Tip sintético",
    content: "Orientación",
    rules: [{ kind: "mood", mood: "Mal" }, {
      kind: "result",
      catalogId: draft.catalogId,
      versionId: draft.versionId,
      version: 1,
      level: "orientacion",
    }],
  });
  assert.equal(typeof tip.id, "string");
  await call("POST", "/tips/" + tip.id + "/publish", {
    requestId: crypto.randomUUID(),
    expectedRevision: 1,
  });
  const event = await call("POST", "/events", {
    requestId: crypto.randomUUID(),
    title: "Feria sintética",
    description: "",
    location: "Sede sintética",
    startsAt: "2026-10-04T12:00:00Z",
    endsAt: "2026-10-04T13:00:00Z",
  });
  await call("POST", "/events/" + event.id + "/publish", {
    requestId: crypto.randomUUID(),
    expectedRevision: 1,
  });
  await call("POST", "/events/" + event.id + "/cancel", {
    requestId: crypto.randomUUID(),
    expectedRevision: 2,
  });
  await reject(() =>
    call("POST", "/tips", {
      requestId: crypto.randomUUID(),
      title: "Inválido",
      content: "Tip",
      rules: [{
        kind: "result",
        catalogId: draft.catalogId,
        versionId: draft.versionId,
        version: 2,
        level: "orientacion",
      }],
    }), "P0422");
  await db.query("reset role");
  await db.query(
    "update private.admin_staff set enabled=false where auth_user_id=$1",
    [f.staff.id],
  );
  await db.query("set local role service_role");
  await reject(
    () =>
      call("POST", path + "/activation", {
        requestId: crypto.randomUUID(),
        expectedRevision: 4,
        active: true,
      }),
    "P0403",
  );
  await db.query("rollback");
  console.log(
    "T009: publicación, activación, clonación, reglas históricas, revisiones, idempotencia y revocación pasaron.",
  );
} finally {
  await db.end();
  await auth.auth.signOut();
}
