import assert from "node:assert/strict";
import {
  authClient,
  database,
  fixtures,
  runtime,
} from "../scripts/runtime.mjs";
const f = fixtures(), r = runtime();
const db = await database();
const send = async (token, path = "/session", extra = {}) =>
  fetch(r.API_URL + "/functions/v1/admin-api" + path, {
    ...extra,
    headers: {
      authorization: "Bearer " + token,
      apikey: r.ANON_KEY,
      ...extra.headers,
    },
  });
try {
  assert.equal((await send("invalid")).status, 401);
  for (const name of ["student", "unassigned", "staff"]) {
    const c = authClient();
    const login = await c.auth.signInWithPassword({
      email: f[name].email,
      password: f[name].password,
    });
    assert(!login.error);
    const token = login.data.session.access_token;
    const response = await send(token);
    assert.equal(response.status, name === "staff" ? 200 : 403);
    if (name === "staff") {
      assert.equal(
        (await send(token, "/session", {
          headers: { origin: "https://wrong.example.test" },
        })).status,
        403,
      );
      const rpc = await c.rpc("admin_access", {
        p_actor: f.staff.id,
        p_session: "00000000-0000-0000-0000-000000000001",
      });
      assert(rpc.error);
      const invalid = await send(token, "/tips", {
        method: "POST",
        body: JSON.stringify({
          requestId: crypto.randomUUID(),
          title: "Fixture",
          content: "Content",
          rules: [],
          actor: f.student.id,
        }),
      });
      assert.equal(invalid.status, 422);
      await db.query(
        "update private.admin_staff set enabled=false where auth_user_id=$1",
        [f.staff.id],
      );
      assert.equal((await send(token)).status, 403);
      await db.query(
        "update private.admin_staff set enabled=true where auth_user_id=$1",
        [f.staff.id],
      );
      await c.auth.signOut();
      assert.equal((await send(token)).status, 401);
    } else await c.auth.signOut();
  }
  console.log(
    "T010: API local rechaza JWT inválido, alumnos, cuentas sin permiso, CORS ajeno, campos de actor, RPC directa, revocación y sesión cerrada.",
  );
} finally {
  await db.query(
    "update private.admin_staff set enabled=true where auth_user_id=$1",
    [f.staff.id],
  );
  await db.end();
}
