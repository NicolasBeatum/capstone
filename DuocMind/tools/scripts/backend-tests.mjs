import { spawnSync } from "node:child_process";
import path from "node:path";
import { projectRoot, runtime } from "./runtime.mjs";
runtime();
for (
  const name of [
    "staff",
    "operations",
    "cron",
    "versions",
    "migration-compatibility",
    "content",
    "rls",
    "transactions",
    "concurrency",
    "api-access",
    "queries",
    "protected-api",
    "security",
    "recovery",
  ]
) {
  const result = spawnSync(process.execPath, [
    path.join(projectRoot, "tools/tests", name + ".mjs"),
  ], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log("Suite de backend local completa.");
