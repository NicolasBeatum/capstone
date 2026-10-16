import assert from "node:assert/strict";
import crypto from "node:crypto";
import { authClient, database, fixtures } from "../scripts/runtime.mjs";
const f = fixtures(), auth = authClient();
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
  const call = async (method, path, body) =>
    (await db.query("select public.admin_mutate($1,$2,$3,$4,$5) result", [
      f.staff.id,
      session,
      method,
      path,
      { requestId: crypto.randomUUID(), ...body },
    ])).rows[0].result;
  const read = async (path) =>
    (await db.query("select public.admin_read($1,$2,$3) result", [
      f.staff.id,
      session,
      path,
    ])).rows[0].result;
  const reject = async (fn, code = "P0422") => {
    await db.query("savepoint negative");
    await assert.rejects(fn, (e) => e.code === code);
    await db.query("rollback to savepoint negative");
  };
  const payload = {
    requestId: crypto.randomUUID(),
    code: "synthetic_" + crypto.randomBytes(5).toString("hex"),
    name: "  Tipo sintético  ",
    order: 0,
  };
  const created = await call("POST", "/event-types", payload),
    path = "/event-types/" + created.id;
  assert.deepEqual(await call("POST", "/event-types", payload), created);
  await reject(
    () => call("POST", "/event-types", { ...payload, name: "Otro" }),
    "P0409",
  );
  await reject(
    () =>
      call("POST", "/event-types", {
        ...payload,
        requestId: crypto.randomUUID(),
      }),
    "23505",
  );
  const initial = (await read("/event-types")).find((t) => t.id === created.id);
  assert.equal(initial.name, "Tipo sintético");
  assert.equal(initial.revision, 1);
  for (
    const body of [
      { code: "BAD" },
      { code: null },
      { name: " " },
      { name: "x".repeat(41) },
      { order: -1 },
      { order: 32768 },
      { order: "1" },
      { order: 1.5 },
    ]
  ) {
    await reject(() =>
      call("POST", "/event-types", {
        ...payload,
        requestId: crypto.randomUUID(),
        ...body,
      })
    );
  }
  await reject(() =>
    call("PUT", path, {
      expectedRevision: 1,
      code: payload.code,
      name: "Cambio",
      order: 2,
    })
  );
  const updated = await call("PUT", path, {
    expectedRevision: 1,
    name: "Renombrado",
    order: 32767,
  });
  assert.equal(updated.revision, 2);
  await reject(
    () =>
      call("PUT", path, { expectedRevision: 1, name: "Obsoleto", order: 1 }),
    "P0409",
  );
  await reject(
    () =>
      call("PUT", "/event-types/32767", {
        expectedRevision: 1,
        name: "Ausente",
        order: 1,
      }),
    "P0404",
  );
  const all = await read("/event-types");
  assert.equal(all.find((t) => t.id === created.id).name, "Renombrado");
  assert(all.every((t, i) => i === 0 || all[i - 1].order <= t.order));
  await reject(
    () =>
      db.query("select public.admin_read($1,$2,$3)", [
        f.student.id,
        session,
        "/event-types",
      ]),
    "P0401",
  );
  const content = {
    title: "Evento tipo sintético",
    description: "",
    location: "Local",
    startsAt: "2030-10-12T12:00:00Z",
    endsAt: "2030-10-12T13:00:00Z",
    typeId: created.id,
  };
  const event = await call("POST", "/events", content),
    eventPath = "/events/" + event.id;
  const eventRead = async () =>
    (await read("/events")).find((e) => e.id === event.id);
  assert.equal((await eventRead()).typeId, created.id);
  await call("PUT", eventPath, {
    ...content,
    typeId: "1",
    expectedRevision: 1,
  });
  assert.equal((await eventRead()).typeId, "1");
  const { typeId, ...legacy } = content;
  await call("PUT", eventPath, { ...legacy, expectedRevision: 2 });
  assert.equal((await eventRead()).typeId, "1");
  for (const typeId of [42, "32767", "32768", "01", "0", "1.5", {}, true]) {
    await reject(() =>
      call("PUT", eventPath, { ...content, typeId, expectedRevision: 3 })
    );
    assert.equal((await eventRead()).revision, 3);
  }
  await call("PUT", eventPath, {
    ...content,
    typeId: null,
    expectedRevision: 3,
  });
  assert.equal((await eventRead()).typeId, null);
  await call("POST", eventPath + "/publish", { expectedRevision: 4 });
  await call("PUT", eventPath, { ...content, expectedRevision: 5 });
  await call("PUT", path, {
    expectedRevision: 2,
    name: "Nombre vigente",
    order: 3,
  });
  await db.query("set local role authenticated");
  const student =
    (await db.query("select public.get_student_events($1) result", [event.id]))
      .rows[0].result.events[0];
  assert.deepEqual(student.type, {
    code: payload.code,
    name: "Nombre vigente",
  });
  await db.query("set local role service_role");
  await call("POST", eventPath + "/cancel", { expectedRevision: 6 });
  await reject(() =>
    call("PUT", eventPath, { ...content, typeId: null, expectedRevision: 7 })
  );
  assert.equal((await eventRead()).typeId, created.id);
  const old = await call("POST", "/events", legacy);
  assert.equal(
    (await read("/events")).find((e) => e.id === old.id).typeId,
    null,
  );
  await db.query("rollback");
  console.log(
    "Tipos: creación, edición, orden, validación, revisión, permiso e idempotencia verificados.",
  );
} finally {
  await db.end();
  await auth.auth.signOut();
}
