import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  authClient,
  database,
  fixtures,
  runtime,
} from "../scripts/runtime.mjs";
const r = runtime(), f = fixtures(), c = authClient(), db = await database();
const login = await c.auth.signInWithPassword({
  email: f.staff.email,
  password: f.staff.password,
});
assert(!login.error);
const token = login.data.session.access_token,
  session =
    JSON.parse(Buffer.from(token.split(".")[1], "base64url")).session_id;
const send = async (studentId, body) =>
  fetch(
    r.API_URL + "/functions/v1/admin-api/students/" + studentId +
      "/password-reset",
    {
      method: "POST",
      headers: {
        authorization: "Bearer " + token,
        apikey: r.ANON_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
const mailList = async () => {
  const response = await fetch("http://127.0.0.1:54324/api/v1/messages");
  assert.equal(response.status, 200);
  return response.json();
};
try {
  await db.query(
    "delete from private.admin_requests where actor=$1 and resource like $2",
    [f.staff.id, "%/password-reset"],
  );
  await db.query("delete from private.password_reset_limits where actor=$1", [
    f.staff.id,
  ]);
  const id = crypto.randomUUID();
  const accepted = await send(f.student.studentId, { requestId: id });
  assert.equal(accepted.status, 200);
  assert.deepEqual(await accepted.json(), { accepted: true });
  const before = (await mailList()).messages.length;
  assert.equal(
    (await send(f.student.studentId, { requestId: id })).status,
    200,
  );
  assert.equal((await mailList()).messages.length, before);
  assert.equal(
    (await send(f.student.studentId, { requestId: crypto.randomUUID() }))
      .status,
    429,
  );
  assert.equal(
    (await send(f.unlinked.studentId, { requestId: crypto.randomUUID() }))
      .status,
    422,
  );
  assert.equal(
    (await send(f.dual.studentId, {
      requestId: crypto.randomUUID(),
      email: f.student.email,
    })).status,
    422,
  );
  const mails = await mailList();
  const message = mails.messages.find((m) =>
    m.To.some((t) => t.Address === f.student.email)
  );
  assert(message);
  const full =
    await (await fetch("http://127.0.0.1:54324/api/v1/message/" + message.ID))
      .json();
  assert(full.HTML.includes("http://127.0.0.1:5173/recover?token_hash="));
  assert(!full.HTML.includes("perfil-student"));
  const legacy = await authClient().auth.resetPasswordForEmail(
    f.unassigned.email,
  );
  assert(!legacy.error);
  const legacyMessages = await mailList();
  const legacyMessage = legacyMessages.messages.find((m) =>
    m.To.some((t) => t.Address === f.unassigned.email)
  );
  const legacyFull = await (await fetch(
    "http://127.0.0.1:54324/api/v1/message/" + legacyMessage.ID,
  )).json();
  assert(legacyFull.HTML.includes("/auth/v1/verify?"));
  assert(!legacyFull.HTML.includes("/recover?token_hash="));
  await db.query("begin");
  await db.query(
    "insert into private.password_reset_limits(actor,student_id,created_at,expires_at) select $1,$2,now()-interval '2 minutes',now()+interval '23 hours 58 minutes' from generate_series(1,10)",
    [f.staff.id, f.student.studentId],
  );
  await assert.rejects(
    db.query("select public.admin_reset_reserve($1,$2,$3,$4)", [
      f.staff.id,
      session,
      f.dual.studentId,
      crypto.randomUUID(),
    ]),
    (e) => e.code === "P0429",
  );
  await db.query("rollback");
  const uncertain = crypto.randomUUID();
  await db.query("select public.admin_reset_reserve($1,$2,$3,$4)", [
    f.staff.id,
    session,
    f.dual.studentId,
    uncertain,
  ]);
  await db.query("select public.admin_reset_finish($1,$2,$3,'uncertain')", [
    f.staff.id,
    session,
    uncertain,
  ]);
  const count = (await mailList()).messages.length;
  assert.equal(
    (await send(f.dual.studentId, { requestId: uncertain })).status,
    503,
  );
  assert.equal((await mailList()).messages.length, count);
  console.log(
    "T012: buzón canónico, dos recorridos de plantilla, idempotencia, límites, extras/desvinculado y respuesta incierta sin reenvío verificados.",
  );
} finally {
  await db.end();
  await c.auth.signOut();
}
