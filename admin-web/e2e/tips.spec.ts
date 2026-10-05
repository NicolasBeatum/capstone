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
  await page.getByRole("textbox", {
    name: "Consejo para el alumno",
    exact: true,
  })
    .fill("Orientación no diagnóstica");
  await page.getByRole("button", { name: "Continuar a cuándo se aplica" })
    .click();
  await page.getByRole("radio", { name: /^Personalizado/ }).check();
  await page.getByLabel("Mal", { exact: true }).check();
  const option = page.getByLabel("Nivel de resultado").locator(
    'optgroup[label*="Fixture histórica"][label*="versión 1"][label*="inactiva"]',
  ).last().locator("option").last();
  await page.getByLabel("Nivel de resultado").selectOption(
    (await option.getAttribute("value"))!,
  );
  await expect(page.getByRole("heading", { name: "Condiciones seleccionadas" }))
    .toBeVisible();
  await expect(
    page.getByText("Basta con que se cumpla una de estas condiciones.", {
      exact: false,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Guardar tip", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Tip y reglas guardados",
  );
  await page.getByRole("button", { name: "Publicar tip", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar publicación del tip" })
    .click();
  await expect(page.getByRole("status")).toContainText("Tip publicado");
  await page.getByRole("navigation", { name: "Pasos para crear el tip" })
    .getByRole("button", { name: "Contenido", exact: true }).click();
  await page.getByRole("textbox", {
    name: "Consejo para el alumno",
    exact: true,
  })
    .fill("Consejo publicado editado");
  await page.getByRole("button", { name: "Guardar tip", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("guardados");
  await page.getByRole("button", { name: "Desactivar tip", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar disponibilidad del tip" })
    .click();
  await expect(page.getByRole("button", { name: "Activar tip", exact: true }))
    .toBeVisible();
  await page.getByRole("navigation", { name: "Pasos para crear el tip" })
    .getByRole("button", { name: "Contenido", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Consejo para el alumno", exact: true }),
  ).toHaveValue("Consejo publicado editado");
});
test("tip general y conflicto conservan contenido", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Continuar a cuándo se aplica" })
    .click();
  await expect(page.getByLabel("Nivel de resultado")).toHaveValue("general");
  await expect(page.getByRole("radio", { name: /^General/ })).toBeChecked();
  await page.getByRole("button", { name: "Anterior", exact: true }).click();
  await page.getByLabel("Título del tip").fill(
    "General sintético " + crypto.randomUUID(),
  );
  await page.getByRole("textbox", {
    name: "Consejo para el alumno",
    exact: true,
  })
    .fill("Consejo general");
  await page.getByRole("button", { name: "Guardar tip", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("guardados");
  await page.getByRole("navigation", { name: "Pasos para crear el tip" })
    .getByRole("button", { name: "Contenido", exact: true }).click();
  await page.getByRole("textbox", {
    name: "Consejo para el alumno",
    exact: true,
  })
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
    page.getByRole("textbox", { name: "Consejo para el alumno", exact: true }),
  ).toHaveValue("Edición conservada");
});

test("general explícito elimina condiciones; personalizado vacío no se guarda", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  const title = "Consejo general explícito " + crypto.randomUUID();
  await page.getByLabel("Título del tip").fill(title);
  await page.getByLabel("Consejo para el alumno", { exact: true }).fill(
    "Reserva un momento para hacer una pausa.",
  );
  await page.getByRole("button", { name: "Continuar a cuándo se aplica" })
    .click();
  await page.getByRole("radio", { name: /^Personalizado/ }).check();
  let writes = 0;
  const sent: unknown[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST" && r.url().endsWith("/admin-api/tips")) {
      writes++;
      sent.push(r.postDataJSON().rules);
    }
  });
  await page.getByRole("button", { name: "Guardar tip", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Selecciona al menos un ánimo",
  );
  expect(writes).toBe(0);
  await page.getByLabel("Mal", { exact: true }).check();
  const result = page.getByLabel("Nivel de resultado").locator(
    'optgroup[label*="Fixture histórica"][label*="versión 1"]',
  ).last().locator("option").first();
  await page.getByLabel("Nivel de resultado").selectOption(
    (await result.getAttribute("value"))!,
  );
  await expect(
    page.getByRole("region", { name: "Cuándo se aplica el consejo" }).getByRole(
      "listitem",
    ),
  ).toHaveCount(2);
  await page.getByRole("region", { name: "Editor de tip", exact: true })
    .screenshot({
      path: "test-results/tips-conditions.png",
    });
  await page.getByLabel("Nivel de resultado").selectOption("general");
  await expect(page.getByRole("radio", { name: /^General/ })).toBeChecked();
  await expect(page.getByLabel("Mal", { exact: true })).not.toBeChecked();
  await expect(
    page.getByRole("region", { name: "Cuándo se aplica el consejo" }).getByRole(
      "listitem",
    ),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Guardar tip", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("guardados");
  expect(sent).toEqual([[]]);
  await page.getByRole("region", { name: "Editor de tip", exact: true })
    .screenshot({
      path: "test-results/tips-review.png",
    });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.locator('[aria-label="Editor de tip"]').evaluate((el) =>
      el.scrollWidth <= el.clientWidth + 1
    ),
  ).toBe(true);
  await page.getByRole("region", { name: "Editor de tip", exact: true })
    .screenshot({
      path: "test-results/tips-mobile.png",
    });
});
