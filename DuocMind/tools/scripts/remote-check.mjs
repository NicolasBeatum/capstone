import fs from "node:fs";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import path from "node:path";
import { projectRoot } from "./runtime.mjs";
const env = Object.fromEntries(
  fs.readFileSync(
    path.resolve(projectRoot, "../admin-web/.env.remote.local"),
    "utf8",
  ).split("\n").filter((x) => x.includes("=")).map((x) => {
    const p = x.indexOf("=");
    return [x.slice(0, p), x.slice(p + 1)];
  }),
);
assert.equal(
  new URL(env.VITE_SUPABASE_URL).hostname,
  "ashgvanzjeaeekpygqgy.supabase.co",
);
const api = env.VITE_ADMIN_API_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
let response = await fetch(api + "/session", {
  headers: { apikey: key, Origin: "http://127.0.0.1:5173" },
  signal: AbortSignal.timeout(20000),
});
assert.equal(response.status, 401);
assert.equal(
  response.headers.get("access-control-allow-origin"),
  "http://127.0.0.1:5173",
);
response = await fetch(api + "/session", {
  headers: { apikey: key, Origin: "https://other.example.test" },
  signal: AbortSignal.timeout(20000),
});
assert.equal(response.status, 403);
response = await fetch(api + "/session", {
  method: "OPTIONS",
  headers: { apikey: key, Origin: "http://127.0.0.1:5173" },
  signal: AbortSignal.timeout(20000),
});
assert.equal(response.status, 204);
response = await fetch(api + "/session", {
  headers: { apikey: key, Authorization: "Bearer invalid-token" },
  signal: AbortSignal.timeout(20000),
});
assert.equal(response.status, 401);
const client = createClient(env.VITE_SUPABASE_URL, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const tests = await client.from("test_bienestar").select(
  "id_test,nombre_test,pregunta_test(id_pregunta,orden,opcion_respuesta(id_opcion))",
).eq("nombre_test", "Escala de Estrés Percibido (PSS-10)").eq("is_active", true)
  .single();
assert.equal(tests.error, null);
assert.equal(tests.data.id_test, 1);
assert.equal(tests.data.pregunta_test.length, 10);
assert.equal(
  tests.data.pregunta_test.reduce((n, q) => n + q.opcion_respuesta.length, 0),
  50,
);
const rpc = await client.rpc("admin_access", {
  p_actor: crypto.randomUUID(),
  p_session: crypto.randomUUID(),
});
assert(rpc.error);
assert.equal(rpc.error.code, "42501");
console.log(
  "Comprobación remota de lectura satisfactoria: API exige sesión, CORS exacto/preflight, token inválido y RPC anónima rechazados; PSS-10 mantiene consulta e IDs (10 preguntas/50 opciones). Sin lectura de perfiles ni escrituras.",
);
