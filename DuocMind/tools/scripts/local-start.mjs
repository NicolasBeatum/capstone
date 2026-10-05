import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { localDir, projectRoot } from "./runtime.mjs";
fs.mkdirSync(localDir, { recursive: true, mode: 0o700 });
fs.chmodSync(localDir, 0o700);
const log = fs.openSync(path.join(localDir, "start.log"), "w", 0o600);
const cli = path.join(projectRoot, "tools/node_modules/.bin/supabase");
const result = spawnSync(cli, [
  "start",
  "--exclude",
  "realtime,storage-api,imgproxy,studio,logflare,vector,supavisor,postgres-meta",
], { cwd: projectRoot, stdio: ["ignore", log, log] });
fs.closeSync(log);
if (result.status !== 0) {
  console.error(
    "No se pudo iniciar Supabase local. Revisa el registro privado de inicio.",
  );
  process.exit(result.status ?? 1);
}
const env = spawnSync(process.execPath, [
  path.join(projectRoot, "tools/scripts/local-env.mjs"),
], { stdio: "inherit" });
if (env.status !== 0) process.exit(env.status ?? 1);
console.log("Supabase local iniciado. El proyecto remoto no se utiliza.");
