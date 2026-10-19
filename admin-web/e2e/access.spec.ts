import { expect, test } from "@playwright/test";
import fs from "node:fs";
const fixtures = JSON.parse(
  fs.readFileSync(
    new URL("../../DuocMind/tools/.local/fixtures.json", import.meta.url),
    "utf8",
  ),
);
test("sesión autorizada, restauración, navegación y cierre", async ({ page }) => {
  await page.goto("/students");
  await expect(
    page.getByRole("heading", { name: "Administración de Bienestar y Salud" }),
  ).toBeVisible();
  await page.getByLabel("Correo institucional").fill(fixtures.staff.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(
    fixtures.staff.password,
  );
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("heading", { name: "Alumnos", exact: true }))
    .toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Alumnos", exact: true }))
    .toBeVisible();
  await page.getByRole("link", { name: "Tests", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tests", exact: true }))
    .toBeVisible();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByRole("button", { name: "Iniciar sesión" }))
    .toBeVisible();
});
test("alumno sin autorización recibe error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo institucional").fill(fixtures.student.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(
    fixtures.student.password,
  );
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("alert")).toContainText("no tiene autorización");
});
test("revocación limpia el acceso con sesión abierta", async ({ page }) => {
  const { execFileSync } = await import("node:child_process");
  const script =
    new URL("../../DuocMind/tools/scripts/staff.mjs", import.meta.url).pathname;
  await page.goto("/login");
  await page.getByLabel("Correo institucional").fill(fixtures.staff.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(
    fixtures.staff.password,
  );
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("heading", { name: "Alumnos", exact: true }))
    .toBeVisible();
  try {
    execFileSync(process.execPath, [script, "staff", "revoke"]);
    await page.reload();
    await expect(page.getByRole("button", { name: "Iniciar sesión" }))
      .toBeVisible();
  } finally {
    execFileSync(process.execPath, [script, "staff", "enable"]);
  }
});
