import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
export const projectRoot = path.resolve(import.meta.dirname, "../..");
export const localDir = path.join(projectRoot, "tools/.local");
export function requireLocal(url) {
  const u = new URL(url);
  if (!["127.0.0.1", "localhost", "::1"].includes(u.hostname)) {
    throw new Error("El entorno de pruebas debe ser exclusivamente local.");
  }
  return url;
}
export function runtime() {
  const r = JSON.parse(
    fs.readFileSync(path.join(localDir, "runtime.json"), "utf8"),
  );
  requireLocal(r.API_URL);
  requireLocal(r.DB_URL);
  return r;
}
export function authClient(privileged = false) {
  const r = runtime();
  return createClient(r.API_URL, privileged ? r.SERVICE_ROLE_KEY : r.ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
export async function database() {
  const r = runtime();
  const client = new pg.Client({ connectionString: r.DB_URL });
  await client.connect();
  return client;
}
export function fixtures() {
  return JSON.parse(
    fs.readFileSync(path.join(localDir, "fixtures.json"), "utf8"),
  );
}
