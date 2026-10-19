import { expect, test } from "@playwright/test";
import fs from "node:fs";
const f = JSON.parse(
  fs.readFileSync(
    new URL("../../DuocMind/tools/.local/fixtures.json", import.meta.url),
    "utf8",
  ),
);
async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Correo institucional").fill(f.staff.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(f.staff.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("table")).toBeVisible();
}
test("registro mínimo, filtros, vacío y cuenta desvinculada", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("columnheader", { name: "Correo de la cuenta" }))
    .toBeVisible();
  await expect(page.getByRole("cell", { name: f.student.email, exact: true }))
    .toBeVisible();
  await expect(
    page.getByRole("row").filter({ hasText: "Cuenta Desvinculada" }).getByRole(
      "button",
      { name: "Enviar recuperación" },
    ),
  ).toBeDisabled();
  await page.getByLabel("Buscar por nombre o correo").fill(
    "sin-coincidencia-sintetica",
  );
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByText("No hay alumnos que coincidan")).toBeVisible();
  await expect(page.getByRole("button", { name: "Siguiente" })).toBeDisabled();
});
test("confirmación y pérdida de red no confirman envío", async ({ page }) => {
  await login(page);
  await page.getByRole("row").filter({ hasText: f.student.email }).getByRole(
    "button",
    { name: "Enviar recuperación" },
  ).click();
  await expect(page.getByRole("region", { name: "Confirmar recuperación" }))
    .toBeVisible();
  await page.route(
    "**/admin-api/students/*/password-reset",
    (route) => route.abort(),
  );
  await page.getByRole("button", { name: "Confirmar envío" }).click();
  await expect(page.getByRole("alert")).toContainText("No se pudo confirmar");
  await expect(page.getByRole("region", { name: "Confirmar recuperación" }))
    .toBeVisible();
  await expect(page.getByText("Solicitud de recuperación aceptada.")).not
    .toBeVisible();
});
