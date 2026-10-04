import fs from "node:fs";
import { database } from "./runtime.mjs";
const db = await database();
try {
  await db.query(fs.readFileSync(process.argv[2], "utf8"));
  console.log("SQL aplicado exclusivamente en Supabase local.");
} catch (e) {
  console.error("SQL local rechazado:", e.code, e.message);
  process.exitCode = 1;
} finally {
  await db.end();
}
