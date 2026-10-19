import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { localDir, projectRoot } from "./runtime.mjs";

// Operación manual autorizada; nunca forma parte de CI ni de las fixtures locales.
const account = JSON.parse(
  fs.readFileSync(path.join(localDir, "remote-test-account.json"), "utf8"),
);
if (
  account.email !== "admin@admin.com" || typeof account.password !== "string" ||
  account.password.length < 10
) {
  throw Error(
    "Se requieren las credenciales solicitadas para la cuenta de prueba.",
  );
}
const keys = spawnSync(
  path.join(projectRoot, "tools/node_modules/.bin/supabase"),
  [
    "projects",
    "api-keys",
    "--project-ref",
    "ashgvanzjeaeekpygqgy",
    "--reveal",
    "--workdir",
    projectRoot,
    "-o",
    "json",
  ],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);
if (keys.status !== 0) {
  throw Error(
    "Inicia sesión en la CLI de Supabase antes de provisionar la cuenta.",
  );
}
const parsed = JSON.parse(keys.stdout);
const items = Array.isArray(parsed) ? parsed : parsed.api_keys;
if (!Array.isArray(items)) {
  throw Error("Formato de claves no reconocido; no se modifica Auth.");
}
const serverKey = items.find((item) => {
  if (typeof item.api_key !== "string" || item.disabled) return false;
  if (item.api_key.startsWith("sb_secret_")) return true;
  try {
    return JSON.parse(
      Buffer.from(item.api_key.split(".")[1], "base64url").toString(),
    ).role === "service_role";
  } catch {
    return false;
  }
})?.api_key;
if (!serverKey) {
  throw Error("No hay una credencial de servidor válida para la API de Auth.");
}
// Claves privilegiadas exclusivamente en memoria; no se guardan ni se imprimen.
const client = createClient(
  "https://ashgvanzjeaeekpygqgy.supabase.co",
  serverKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, signal: AbortSignal.timeout(20000) }),
    },
  },
);
const result = await client.auth.admin.createUser({
  email: account.email,
  password: account.password,
  email_confirm: true,
  user_metadata: { purpose: "admin-dashboard-test" },
});
if (result.error) {
  throw Error(
    "Auth no creó la cuenta (" + (result.error.code ?? "error") +
      "). No se altera una cuenta existente.",
  );
}
fs.writeFileSync(
  path.join(localDir, "remote-created-account.json"),
  JSON.stringify({ id: result.data.user.id, email: account.email }),
  { mode: 0o600 },
);
console.log(
  "Cuenta de prueba creada por Auth Admin API, sin enviar correo ni guardar claves privilegiadas. Falta habilitarla mediante el operador SQL.",
);
