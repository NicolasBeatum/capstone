import crypto from "node:crypto";
import assert from "node:assert/strict";
import { authClient, fixtures, runtime } from "./runtime.mjs";
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
  const call = async (path, payload) => {
    const response = await fetch(r.API_URL + "/functions/v1/admin-api" + path, {
      method: "POST",
      headers,
      body: JSON.stringify({ requestId: crypto.randomUUID(), ...payload }),
    });
    assert.equal(response.status, 200);
    return response.json();
  };
  const content = {
    title: "Fixture histórica " + crypto.randomUUID(),
    description: "",
    questions: [{
      text: "Fixture histórica",
      helper: "",
      options: [{ text: "Cero", score: 0 }, { text: "Uno", score: 1 }],
    }],
    levels: [{
      key: "historico",
      label: "Orientación histórica",
      content: "Consejo general",
      min: 0,
      max: 1,
    }],
  };
  const a = await call("/tests", content);
  await call("/tests/versions/" + a.versionId + "/publish", {
    expectedRevision: 1,
  });
  const b = await call("/tests/versions/" + a.versionId + "/clone", {
    expectedRevision: 2,
  });
  await call("/tests/versions/" + b.versionId + "/publish", {
    expectedRevision: 1,
  });
  await call("/tests/versions/" + b.versionId + "/activation", {
    expectedRevision: 2,
    active: true,
  });
  console.log(
    "Fixture histórica publicada/inactiva preparada con versión posterior activa.",
  );
} finally {
  await c.auth.signOut({ scope: "local" });
}
