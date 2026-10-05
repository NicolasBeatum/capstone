import { expect, test } from "@playwright/test";
import fs from "node:fs";
const f = JSON.parse(
  fs.readFileSync(
    new URL("../../DuocMind/tools/.local/fixtures.json", import.meta.url),
    "utf8",
  ),
);
test("instrumento protegido: solo consulta y disponibilidad", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo institucional").fill(f.staff.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(f.staff.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.getByRole("link", { name: "Tests", exact: true }).click();
  await page.getByRole("region").filter({
    has: page.getByRole("heading", { name: "WHO-5 · Bienestar" }),
  }).getByRole("link", { name: "Versión 1" }).click();
  await expect(page.getByRole("heading", { name: "WHO-5 · Bienestar" }))
    .toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar borrador" })).not
    .toBeVisible();
  await expect(page.getByRole("button", { name: "Clonar nueva versión" })).not
    .toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
  await page.getByRole("button", { name: "Desactivar instrumento" }).click();
  await page.getByRole("button", { name: "Confirmar disponibilidad" }).click();
  await expect(page.getByRole("button", { name: "Activar instrumento" }))
    .toBeVisible();
  await expect(
    page.getByText("Me he sentido alegre y de buen humor", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Activar instrumento" }).click();
  await page.getByRole("button", { name: "Confirmar disponibilidad" }).click();
  await expect(page.getByRole("button", { name: "Desactivar instrumento" }))
    .toBeVisible();
});
