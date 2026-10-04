import { expect, test } from "@playwright/test";
import fs from "node:fs";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const f = JSON.parse(
  fs.readFileSync(
    new URL("../../DuocMind/tools/.local/fixtures.json", import.meta.url),
    "utf8",
  ),
);
const r = JSON.parse(
  fs.readFileSync(
    new URL("../../DuocMind/tools/.local/runtime.json", import.meta.url),
    "utf8",
  ),
);
if (!["localhost", "127.0.0.1"].includes(new URL(r.API_URL).hostname)) {
  throw Error("Solo local.");
}
const client = createClient(r.API_URL, r.ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
test("enlace web, confirmación, cambio y sesión administrativa independiente", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo institucional").fill(f.staff.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(f.staff.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("heading", { name: "Alumnos", exact: true }))
    .toBeVisible();
  const session = await page.evaluate(() =>
    sessionStorage.getItem("duocmind-admin-session")
  );
  const reset = await client.auth.resetPasswordForEmail(f.student.email, {
    redirectTo: "http://127.0.0.1:5173/recover",
  });
  if (reset.error) throw Error("No se pudo crear correo sintético.");
  const messages = await (await fetch("http://127.0.0.1:54324/api/v1/messages"))
    .json();
  const message = messages.messages.find((m: { To: { Address: string }[] }) =>
    m.To.some((t) => t.Address === f.student.email)
  );
  const full =
    await (await fetch("http://127.0.0.1:54324/api/v1/message/" + message.ID))
      .json();
  const link = String(full.HTML).match(/href="([^"]+)"/)?.[1].replaceAll(
    "&amp;",
    "&",
  );
  if (!link) throw Error("Enlace sintético ausente.");
  const newPassword = crypto.randomBytes(24).toString("base64url");
  const admin = createClient(r.API_URL, r.SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try {
    await page.goto(link);
    await expect(page).toHaveURL("http://127.0.0.1:5173/recover");
    await page.getByRole("button", { name: "Validar enlace" }).click();
    await expect(page.getByLabel("Nueva contraseña", { exact: true }))
      .toBeVisible();
    await page.getByLabel("Nueva contraseña", { exact: true }).fill(
      newPassword,
    );
    await page.getByLabel("Confirmar contraseña").fill("diferente");
    await page.getByRole("button", { name: "Guardar nueva contraseña" })
      .click();
    await expect(page.getByRole("alert")).toContainText("deben coincidir");
    await page.getByLabel("Nueva contraseña", { exact: true }).fill(
      newPassword,
    );
    await page.getByLabel("Confirmar contraseña").fill(newPassword);
    await page.getByRole("button", { name: "Guardar nueva contraseña" })
      .click();
    await expect(page.getByRole("status")).toContainText(
      "Contraseña actualizada",
    );
    expect(
      await page.evaluate(() =>
        sessionStorage.getItem("duocmind-admin-session")
      ),
    ).toEqual(session);
    const login = await client.auth.signInWithPassword({
      email: f.student.email,
      password: newPassword,
    });
    expect(login.error).toBeNull();
    await client.auth.signOut();
    await page.goto(link);
    await page.getByRole("button", { name: "Validar enlace" }).click();
    await expect(page.getByRole("alert")).toContainText("No se pudo validar");
    await page.reload();
    await expect(page.getByText("El enlace no está disponible.")).toBeVisible();
  } finally {
    const restored = await admin.auth.admin.updateUserById(f.student.id, {
      password: f.student.password,
    });
    if (restored.error) throw Error("No se pudo restaurar la fixture.");
  }
});
test("enlace inválido y limpieza de URL", async ({ page }) => {
  await page.goto("/recover?token_hash=invalid_fixture&type=recovery");
  await expect(page).toHaveURL("http://127.0.0.1:5173/recover");
  await page.getByRole("button", { name: "Validar enlace" }).click();
  await expect(page.getByRole("alert")).toContainText("No se pudo validar");
});
test("enlace vencido y fallo de conexión no confirman cambio", async ({ page }) => {
  const response = await client.auth.resetPasswordForEmail(f.unassigned.email, {
    redirectTo: "http://127.0.0.1:5173/recover",
  });
  if (response.error) throw Error("Fixture de correo no disponible.");
  const messages = await (await fetch("http://127.0.0.1:54324/api/v1/messages"))
    .json();
  const message = messages.messages.find((m: { To: { Address: string }[] }) =>
    m.To.some((t) => t.Address === f.unassigned.email)
  );
  const full =
    await (await fetch("http://127.0.0.1:54324/api/v1/message/" + message.ID))
      .json();
  const link = String(full.HTML).match(/href="([^"]+)"/)?.[1].replaceAll(
    "&amp;",
    "&",
  );
  if (!link) throw Error("Fixture ausente.");
  const { execFileSync } = await import("node:child_process");
  execFileSync(process.execPath, [
    new URL("../../DuocMind/tools/scripts/expire-recovery.mjs", import.meta.url)
      .pathname,
  ]);
  await page.goto(link);
  await page.getByRole("button", { name: "Validar enlace" }).click();
  await expect(page.getByRole("alert")).toContainText("No se pudo validar");
  await page.goto("/recover?token_hash=network_fixture&type=recovery");
  await page.route("**/auth/v1/verify", (route) => route.abort());
  await page.getByRole("button", { name: "Validar enlace" }).click();
  await expect(page.getByRole("alert")).toContainText("No se pudo validar");
  await expect(page.getByRole("button", { name: "Guardar nueva contraseña" }))
    .not.toBeVisible();
});
