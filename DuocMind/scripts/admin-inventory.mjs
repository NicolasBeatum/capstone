import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
const root = path.resolve(import.meta.dirname, "..");
const migrations = fs.readdirSync(path.join(root, "supabase/migrations"))
  .filter((x) => x.endsWith(".sql")).sort();
const sql = migrations.map((file) =>
  fs.readFileSync(path.join(root, "supabase/migrations", file), "utf8")
).join("\n");
const tables = [...sql.matchAll(/create table public\.(\w+)/gi)].map((m) =>
  m[1]
);
assert(tables.includes("estudiante") && tables.includes("material_test"));
const files = ["who5", "phq9", "gad7", "sondeoInicial"].map((x) =>
  `src/features/emotional-checkin/data/${x}.ts`
);
const protectedNames = files.map((file) => ({
  file,
  sha256: crypto.createHash("sha256").update(
    fs.readFileSync(path.join(root, file)),
  ).digest("hex"),
}));
const stress = fs.readFileSync(
  path.join(
    root,
    "src/features/emotional-checkin/infrastructure/stressTestRepository.ts",
  ),
  "utf8",
);
assert(
  stress.includes(
    ".eq('nombre_test', 'Escala de Estrés Percibido (PSS-10)')",
  ) && stress.includes(".eq('is_active', true)") &&
    stress.includes(".single()"),
);
const profileOwn = sql.includes("using (auth_user_id = (select auth.uid()))");
assert(profileOwn);
console.log(JSON.stringify(
  {
    migrations,
    tables,
    protectedNames,
    pss10: {
      name: "Escala de Estrés Percibido (PSS-10)",
      query: "nombre_test + is_active + single; preguntas/opciones anidadas",
      existsInVersionedSeed: /insert into public\.test_bienestar/i.test(sql),
    },
    authorization: "No existe registro administrativo en migraciones iniciales",
    studentIsolation: profileOwn,
  },
  null,
  2,
));
