import assert from "node:assert/strict";
import crypto from "node:crypto";
import { authClient, database, fixtures } from "../scripts/runtime.mjs";
const auth = authClient();
const f = fixtures();
const login = await auth.auth.signInWithPassword({
  email: f.staff.email,
  password: f.staff.password,
});
assert(!login.error);
const session = JSON.parse(
  Buffer.from(login.data.session.access_token.split(".")[1], "base64url"),
).session_id;
const a = await database(), b = await database();
const call = async (db, method, path, payload) =>
  (await db.query("select public.admin_mutate($1,$2,$3,$4,$5) result", [
    f.staff.id,
    session,
    method,
    path,
    payload,
  ])).rows[0].result;
try {
  await a.query("set role service_role");
  await b.query("set role service_role");
  const data = {
    requestId: crypto.randomUUID(),
    title: "Fixture concurrencia " + crypto.randomUUID(),
    description: "",
    questions: [{
      text: "Fixture",
      options: [{ text: "Cero", score: 0 }, { text: "Dos", score: 2 }],
    }],
    levels: [{
      key: "general",
      label: "General",
      content: "Orientación",
      min: 0,
      max: 1,
    }],
  };
  const t = await call(a, "POST", "/tests", data);
  const path = "/tests/versions/" + t.versionId;
  await assert.rejects(
    call(a, "POST", path + "/publish", {
      requestId: crypto.randomUUID(),
      expectedRevision: 1,
    }),
    (e) => e.code === "P0422",
  );
  await call(a, "PUT", path + "/draft", {
    ...data,
    requestId: crypto.randomUUID(),
    expectedRevision: 1,
    levels: [{ ...data.levels[0], max: 2 }],
  });
  await call(a, "POST", path + "/publish", {
    requestId: crypto.randomUUID(),
    expectedRevision: 2,
  });
  const outcomes = await Promise.allSettled([
    call(a, "POST", path + "/activation", {
      requestId: crypto.randomUUID(),
      expectedRevision: 3,
      active: true,
    }),
    call(b, "POST", path + "/activation", {
      requestId: crypto.randomUUID(),
      expectedRevision: 3,
      active: true,
    }),
  ]);
  assert.equal(outcomes.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(
    outcomes.find((r) => r.status === "rejected").reason.code,
    "P0409",
  );
  const ep = {
    requestId: crypto.randomUUID(),
    title: "Fixture vencimiento",
    description: "",
    location: "Local",
    startsAt: "2026-10-04T12:00:00Z",
    endsAt: "2026-10-04T13:00:00Z",
  };
  const first = await call(a, "POST", "/events", ep);
  await a.query("reset role");
  await a.query(
    "update private.admin_requests set created_at=now()-interval '24 hours',expires_at=now() where request_id=$1",
    [ep.requestId],
  );
  await a.query("set role service_role");
  const second = await call(a, "POST", "/events", ep);
  assert.notEqual(first.id, second.id);
  console.log(
    "T009: rangos incompletos rechazados, concurrencia resuelta por revisión y deduplicación vencida no reutilizada.",
  );
} finally {
  await a.end();
  await b.end();
  await auth.auth.signOut();
}
