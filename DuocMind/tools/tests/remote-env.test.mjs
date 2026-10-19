import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = path.resolve(import.meta.dirname, "../scripts/remote-env.mjs");
const cloudUrl = "https://ashgvanzjeaeekpygqgy.supabase.co";
const publicKey = "sb_publishable_synthetic_docker_test";

function runFixture(t, { url = cloudUrl, key = publicKey, missing = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "duocmind-remote-env-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const scriptDir = path.join(root, "DuocMind/tools/scripts");
  const adminDir = path.join(root, "admin-web");
  fs.mkdirSync(scriptDir, { recursive: true });
  fs.mkdirSync(adminDir);
  fs.copyFileSync(script, path.join(scriptDir, "remote-env.mjs"));
  const localFile = path.join(adminDir, ".env.local");
  fs.writeFileSync(localFile, "LOCAL_SYNTHETIC_CONFIGURATION=preserved\n");
  if (!missing) {
    fs.writeFileSync(
      path.join(root, "DuocMind/.env"),
      `EXPO_PUBLIC_SUPABASE_URL=${url}\nEXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${key}\nPRIVATE_SYNTHETIC_VALUE=never-export\n`,
      { mode: 0o600 },
    );
  }
  const result = spawnSync(process.execPath, [path.join(scriptDir, "remote-env.mjs")], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, NODE_PATH: "" },
  });
  assert.equal(result.error, undefined);
  assert.equal(fs.readFileSync(localFile, "utf8"), "LOCAL_SYNTHETIC_CONFIGURATION=preserved\n");
  assert.ok(!`${result.stdout}${result.stderr}`.includes(key));
  return { result, target: path.join(adminDir, ".env.remote.local") };
}

test("genera configuración cloud sin runtime ni paquetes externos", (t) => {
  const { result, target } = runFixture(t);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(target, "utf8"),
    `VITE_SUPABASE_URL=${cloudUrl}\nVITE_SUPABASE_PUBLISHABLE_KEY=${publicKey}\nVITE_ADMIN_API_URL=${cloudUrl}/functions/v1/admin-api\n`);
  assert.equal(fs.statSync(target).mode & 0o777, 0o600);
});

test("mantiene compatibilidad con anon legado", (t) => {
  const key = `eyJsynthetic.${Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url")}.synthetic`;
  const { result, target } = runFixture(t, { key });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(fs.readFileSync(target, "utf8").includes(key));
});

test("informa la falta del archivo sin generar configuración", (t) => {
  const { result, target } = runFixture(t, { missing: true });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /No se pudo leer DuocMind\/\.env/);
  assert.equal(fs.existsSync(target), false);
});

test("rechaza proyectos distintos al autorizado", (t) => {
  const { result, target } = runFixture(t, { url: "https://synthetic.supabase.co" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /proyecto DuocMind autorizado/);
  assert.equal(fs.existsSync(target), false);
});

for (const key of ["sb_secret_synthetic_docker_test", "invalid-synthetic-key",
  `eyJsynthetic.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.synthetic`]) {
  test(`rechaza clave ${key.startsWith("sb_secret") ? "secret" : key.startsWith("eyJ") ? "service_role" : "inválida"} sin revelarla`, (t) => {
    const { result, target } = runFixture(t, { key });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /clave publicable; nunca una clave de servidor/);
    assert.equal(fs.existsSync(target), false);
  });
}
