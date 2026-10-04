import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { localDir, projectRoot, runtime } from "./runtime.mjs";
runtime();
const log = fs.openSync(path.join(localDir, "functions.log"), "w", 0o600);
console.log("API administrativa local en ejecución.");
const result = spawnSync(
  path.join(projectRoot, "tools/node_modules/.bin/supabase"),
  [
    "functions",
    "serve",
    "admin-api",
    "--env-file",
    path.join(localDir, "functions.env"),
    "--no-verify-jwt",
  ],
  { cwd: projectRoot, stdio: ["ignore", log, log] },
);
fs.closeSync(log);
process.exit(result.status ?? 1);
