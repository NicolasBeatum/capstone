import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  authClient,
  database,
  fixtures,
  runtime,
} from "../scripts/runtime.mjs";
const f = fixtures(),
  r = runtime(),
  staff = authClient(),
  student = authClient();
const db = await database();
let typeId, eventId;
try {
  const login = await staff.auth.signInWithPassword({
    email: f.staff.email,
    password: f.staff.password,
  });
  assert(!login.error);
  const studentLogin = await student.auth.signInWithPassword({
    email: f.student.email,
    password: f.student.password,
  });
  assert(!studentLogin.error);
  const send = async (token, method, path, body) =>
    fetch(r.API_URL + "/functions/v1/admin-api" + path, {
      method,
      headers: {
        apikey: r.ANON_KEY,
        authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      ...(body
        ? { body: JSON.stringify({ requestId: crypto.randomUUID(), ...body }) }
        : {}),
    });
  const token = login.data.session.access_token;
  assert.equal(
    (await send(studentLogin.data.session.access_token, "GET", "/event-types"))
      .status,
    403,
  );
  assert.equal(
    (await send(
      studentLogin.data.session.access_token,
      "POST",
      "/event-types",
      { code: "denied", name: "Denegado", order: 1 },
    )).status,
    403,
  );
  const body = {
    requestId: crypto.randomUUID(),
    code: "api_" + crypto.randomBytes(6).toString("hex"),
    name: "  Tipo API sintético  ",
    order: 0,
  };
  const response = await send(token, "POST", "/event-types", body);
  assert.equal(response.status, 200);
  const created = await response.json();
  typeId = created.id;
  assert.deepEqual(
    await (await send(token, "POST", "/event-types", body)).json(),
    created,
  );
  const types = await (await send(token, "GET", "/event-types")).json();
  assert.equal(types.find((t) => t.id === typeId).name, "Tipo API sintético");
  assert.equal(
    (await send(token, "POST", "/event-types", {
      ...body,
      requestId: crypto.randomUUID(),
    })).status,
    422,
  );
  assert.equal(
    (await send(token, "PUT", "/event-types/" + typeId, {
      expectedRevision: 1,
      code: body.code,
      name: "Otro",
      order: 1,
    })).status,
    422,
  );
  const results = await Promise.all([
    send(token, "PUT", "/event-types/" + typeId, {
      expectedRevision: 1,
      name: "Nombre A",
      order: 1,
    }),
    send(token, "PUT", "/event-types/" + typeId, {
      expectedRevision: 1,
      name: "Nombre B",
      order: 1,
    }),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  const content = {
    title: "Evento API sintético",
    description: "",
    location: "Local",
    startsAt: "2030-10-12T12:00:00Z",
    endsAt: "2030-10-12T13:00:00Z",
    typeId,
  };
  const event = await send(token, "POST", "/events", content);
  assert.equal(event.status, 200);
  eventId = (await event.json()).id;
  const events = await (await send(token, "GET", "/events")).json();
  assert.equal(events.find((e) => e.id === eventId).typeId, typeId);
  assert.equal(
    (await send(token, "PUT", "/events/" + eventId, {
      ...content,
      typeId: "32767",
      expectedRevision: 1,
    })).status,
    422,
  );
  await db.query(
    "update private.admin_staff set enabled=false where auth_user_id=$1",
    [f.staff.id],
  );
  assert.equal((await send(token, "GET", "/event-types")).status, 403);
  console.log(
    "Tipos API: permisos, revocación, normalización, duplicados, idempotencia, concurrencia y asignación comprobados.",
  );
} finally {
  await db.query(
    "update private.admin_staff set enabled=true where auth_user_id=$1",
    [f.staff.id],
  );
  if (eventId) {
    await db.query("delete from public.evento_institucional where id=$1", [
      eventId,
    ]);
  }
  if (typeId) {
    await db.query("delete from public.tipo_evento_institucional where id=$1", [
      typeId,
    ]);
  }
  await db.end();
  await staff.auth.signOut();
  await student.auth.signOut();
}
