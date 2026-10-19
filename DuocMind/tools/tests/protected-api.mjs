import assert from "node:assert/strict";
import crypto from "node:crypto";
import { authClient, fixtures, runtime } from "../scripts/runtime.mjs";
const c = authClient(), f = fixtures(), r = runtime();
try {
  const login = await c.auth.signInWithPassword({
    email: f.staff.email,
    password: f.staff.password,
  });
  assert(!login.error);
  const headers = {
    authorization: "Bearer " + login.data.session.access_token,
    apikey: r.ANON_KEY,
    "content-type": "application/json",
  };
  const call = (path, method = "GET", payload) =>
    fetch(r.API_URL + "/functions/v1/admin-api" + path, {
      method,
      headers,
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });
  const catalogs = await (await call("/tests")).json();
  const who = catalogs.find((c) => c.code === "who5");
  const path = "/tests/versions/" + who.versions[0].versionId;
  const before = await (await call(path)).json();
  for (const op of ["clone", "publish"]) {
    assert.equal(
      (await call(path + "/" + op, "POST", {
        requestId: crypto.randomUUID(),
        expectedRevision: before.revision,
      })).status,
      403,
    );
  }
  const draft = {
    requestId: crypto.randomUUID(),
    expectedRevision: before.revision,
    title: "Cambiar protegido",
    description: before.description,
    questions: before.questions.map((q) => ({
      text: q.text,
      helper: q.helper,
      options: q.options.map((o) => ({ text: o.text, score: o.score })),
    })),
    levels: before.levels,
  };
  assert.equal((await call(path + "/draft", "PUT", draft)).status, 403);
  assert.equal(
    (await call(path + "/activation", "POST", {
      requestId: crypto.randomUUID(),
      expectedRevision: before.revision,
      active: true,
      code: "custom",
    })).status,
    422,
  );
  assert.deepEqual(await (await call(path)).json(), before);
  console.log(
    "T017: API rechaza clonación, publicación, edición y cambio de código protegido; contenido intacto.",
  );
} finally {
  await c.auth.signOut();
}
