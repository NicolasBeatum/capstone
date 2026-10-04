import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { localDir, projectRoot, requireLocal } from "./runtime.mjs";
const cli = path.join(projectRoot, "tools/node_modules/.bin/supabase");
const r = JSON.parse(
  execFileSync(cli, ["status", "-o", "json"], {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
requireLocal(r.API_URL);
requireLocal(r.DB_URL);
fs.mkdirSync(localDir, { recursive: true, mode: 0o700 });
fs.writeFileSync(path.join(localDir, "runtime.json"), JSON.stringify(r), {
  mode: 0o600,
});
fs.writeFileSync(
  path.resolve(projectRoot, "../admin-web/.env.local"),
  `VITE_SUPABASE_URL=${r.API_URL}\nVITE_SUPABASE_PUBLISHABLE_KEY=${r.ANON_KEY}\nVITE_ADMIN_API_URL=${r.API_URL}/functions/v1/admin-api\n`,
  { mode: 0o600 },
);
fs.writeFileSync(
  path.join(localDir, "functions.env"),
  "ADMIN_WEB_ORIGIN=http://127.0.0.1:5173\n",
  { mode: 0o600 },
);
console.log(
  "Configuración local generada en archivos ignorados; no se muestran claves.",
);
