import fs from "node:fs";
import path from "node:path";
import { projectRoot } from "./runtime.mjs";

const values = Object.fromEntries(
  fs.readFileSync(path.join(projectRoot, ".env"), "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const separator = line.indexOf("=");
      return [
        line.slice(0, separator).trim(),
        line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, ""),
      ];
    }),
);
const url = values.EXPO_PUBLIC_SUPABASE_URL;
const key = values.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (url !== "https://ashgvanzjeaeekpygqgy.supabase.co") {
  throw Error(
    "El modo remoto corresponde únicamente al proyecto DuocMind autorizado.",
  );
}
let publishable = key?.startsWith("sb_publishable_");
if (!publishable && key?.startsWith("eyJ")) {
  try {
    publishable =
      JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString())
        .role === "anon";
  } catch { /* La clave inválida se rechaza abajo. */ }
}
if (!publishable || /[\r\n]/.test(key)) {
  throw Error("Se requiere una clave publicable; nunca una clave de servidor.");
}
const target = path.resolve(projectRoot, "../admin-web/.env.remote.local");
fs.writeFileSync(
  target,
  `VITE_SUPABASE_URL=${url}\nVITE_SUPABASE_PUBLISHABLE_KEY=${key}\nVITE_ADMIN_API_URL=${url}/functions/v1/admin-api\n`,
  { mode: 0o600 },
);
fs.chmodSync(target, 0o600);
console.log(
  "Configuración web remota generada en archivo ignorado. Entorno local de pruebas conservado.",
);
