import { setTimeout } from "node:timers/promises";
import { runtime } from "./runtime.mjs";
const r = runtime();
let ready = false;
for (let i = 0; i < 60; i++) {
  try {
    const response = await fetch(
      r.API_URL + "/functions/v1/admin-api/session",
      { headers: { apikey: r.ANON_KEY }, signal: AbortSignal.timeout(1000) },
    );
    const body = await response.json();
    if (
      response.status === 401 &&
      body.error === "Sesión inválida. Inicia sesión nuevamente."
    ) {
      ready = true;
      break;
    }
  } catch {}
  await setTimeout(1000);
}
if (!ready) throw Error("La API local no está disponible.");
console.log("API administrativa local disponible y autenticación exigida.");
