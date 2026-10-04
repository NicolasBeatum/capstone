import { expect, test } from "@playwright/test";
import fs from "node:fs";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
const f = JSON.parse(
  fs.readFileSync(
    new URL("../../DuocMind/tools/.local/fixtures.json", import.meta.url),
    "utf8",
  ),
);
test.beforeAll(() => {
  execFileSync(process.execPath, [
    new URL("../../DuocMind/tools/scripts/tip-history.mjs", import.meta.url)
      .pathname,
  ]);
});
async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Correo institucional").fill(f.staff.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(f.staff.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.getByRole("link", { name: "Tips", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tips", exact: true }))
    .toBeVisible();
}
test("tip con ánimo y versión histórica, publicar, editar y desactivar", async ({ page }) => {
  await login(page);
  await page.getByLabel("Título del tip").fill(
    "Tip sintético " + crypto.randomUUID(),
  );
  await page.getByRole("textbox", { name: "Contenido del tip", exact: true })
    .fill("Orientación no diagnóstica");
  await page.getByLabel("Mal", { exact: true }).check();
  const option = page.getByLabel("Nivel de resultado").getByRole("option")
    .filter({ hasText: /Fixture histórica.*v1.*inactiva/ }).last();
  await page.getByLabel("Nivel de resultado").selectOption(
    (await option.getAttribute("value"))!,
  );
  await page.getByRole("button", { name: "Añadir regla de resultado" }).click();
  await expect(page.getByText("Reglas asociadas (OR)")).toBeVisible();
  await page.getByRole("button", { name: "Guardar tip", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Tip y reglas guardados",
  );
  await page.getByRole("button", { name: "Publicar tip", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar publicación del tip" })
    .click();
  await expect(page.getByRole("status")).toContainText("Tip publicado");
  await page.getByRole("textbox", { name: "Contenido del tip", exact: true })
    .fill("Consejo publicado editado");
  await page.getByRole("button", { name: "Guardar tip", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("guardados");
  await page.getByRole("button", { name: "Desactivar tip", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar disponibilidad del tip" })
    .click();
  await expect(page.getByRole("button", { name: "Activar tip", exact: true }))
    .toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Contenido del tip", exact: true }),
  ).toHaveValue("Consejo publicado editado");
});
test("tip general y conflicto conservan contenido", async ({ page }) => {
  await login(page);
  await expect(page.getByText("Sin reglas, este consejo es general."))
    .toBeVisible();
  await page.getByLabel("Título del tip").fill(
    "General sintético " + crypto.randomUUID(),
  );
  await page.getByRole("textbox", { name: "Contenido del tip", exact: true })
    .fill("Consejo general");
  await page.getByRole("button", { name: "Guardar tip", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("guardados");
  await page.getByRole("textbox", { name: "Contenido del tip", exact: true })
    .fill("Edición conservada");
  await page.route(
    "**/admin-api/tips/*",
    (route) =>
      route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ error: "Conflicto de revisión." }),
      }),
  );
  await page.getByRole("button", { name: "Guardar tip", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Conflicto");
  await expect(
    page.getByRole("textbox", { name: "Contenido del tip", exact: true }),
  ).toHaveValue("Edición conservada");
});
