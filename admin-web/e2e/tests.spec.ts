import { expect, test } from "@playwright/test";
import fs from "node:fs";
import crypto from "node:crypto";
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
  await expect(page.getByRole("heading", { name: "Alumnos", exact: true }))
    .toBeVisible();
}
test("cuestionario propio: guardar, revisar, publicar, activar y clonar", async ({ page }) => {
  await login(page);
  await page.goto("/tests/new");
  await page.getByLabel("Título", { exact: true }).fill(
    "Fixture web " + crypto.randomUUID(),
  );
  await page.getByRole("button", { name: "Añadir pregunta", exact: true })
    .click();
  await page.getByLabel("Texto de pregunta 1").fill("Pregunta sintética");
  await page.getByLabel("Opción 1 de pregunta 1", { exact: true }).fill(
    "Nunca",
  );
  await page.getByLabel("Opción 2 de pregunta 1", { exact: true }).fill(
    "A veces",
  );
  await page.getByRole("button", { name: "Añadir nivel", exact: true }).click();
  await page.getByLabel("Clave del nivel 1").fill("general");
  await page.getByLabel("Etiqueta del nivel 1").fill("General");
  await page.getByLabel("Máximo del nivel 1").fill("1");
  await page.getByLabel("Orientación del nivel 1").fill(
    "Orientación no diagnóstica",
  );
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page).toHaveURL(/\/tests\/versions\/\d+$/);
  await page.getByRole("button", { name: "Vista previa", exact: true }).click();
  await page.getByRole("region", { name: "Vista previa" }).getByLabel("Nunca", {
    exact: true,
  }).check();
  await expect(
    page.getByRole("region", { name: "Vista previa" }).getByRole("status"),
  ).toContainText("Puntaje de vista previa: 0");
  await page.getByRole("button", { name: "Cerrar vista previa" }).click();
  await page.getByRole("button", { name: "Publicar versión" }).click();
  await page.getByRole("button", { name: "Confirmar publicación" }).click();
  await expect(page.getByRole("status")).toContainText(
    "activación es una operación aparte",
  );
  await expect(page.getByRole("button", { name: "Activar versión" }))
    .toBeVisible();
  await expect(page.getByLabel("Título", { exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Activar versión" }).click();
  await page.getByRole("button", { name: "Confirmar disponibilidad" }).click();
  await expect(page.getByRole("button", { name: "Desactivar versión" }))
    .toBeVisible();
  const prior = page.url();
  await page.getByRole("button", { name: "Clonar nueva versión" }).click();
  await expect(page).not.toHaveURL(prior);
  await expect(page.getByRole("heading", { name: "Versión 2" })).toBeVisible();
  await expect(page.getByLabel("Título", { exact: true })).toBeEnabled();
});
test("conflicto de edición conserva formulario", async ({ page }) => {
  await login(page);
  await page.goto("/tests/new");
  await page.getByLabel("Título", { exact: true }).fill(
    "Fixture conflicto " + crypto.randomUUID(),
  );
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page).toHaveURL(/\/tests\/versions\/\d+$/);
  await page.getByRole("textbox", { name: "Descripción", exact: true }).fill(
    "Edición local conservada",
  );
  await page.route(
    "**/admin-api/tests/versions/*/draft",
    (route) =>
      route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Revisión en conflicto. Recarga el estado.",
        }),
      }),
  );
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page.getByRole("alert")).toContainText("conflicto");
  await expect(page.getByRole("textbox", { name: "Descripción", exact: true }))
    .toHaveValue("Edición local conservada");
});
test("fallo de lectura de una versión impide crear otro cuestionario", async ({ page }) => {
  await login(page);
  await page.goto("/tests/new");
  const title = "Fixture lectura " + crypto.randomUUID();
  await page.getByLabel("Título", { exact: true }).fill(title);
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page).toHaveURL(/\/tests\/versions\/\d+$/);
  const url = page.url();
  let writes = 0;
  page.on("request", (request) => {
    if (
      request.url().includes("/admin-api/tests") && request.method() !== "GET"
    ) writes++;
  });
  await page.route("**/admin-api/tests/versions/*", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Servicio no disponible." }),
    }));
  await page.goto(url);
  await expect(page.getByRole("alert")).toContainText("Servicio no disponible");
  await expect(page.getByRole("button", { name: "Guardar borrador" }))
    .toHaveCount(0);
  await expect(page.getByLabel("Título", { exact: true })).toHaveCount(0);
  expect(writes).toBe(0);
  await page.unroute("**/admin-api/tests/versions/*");
  await page.getByRole("button", { name: "Recargar estado" }).click();
  await expect(page.getByLabel("Título", { exact: true })).toHaveValue(title);
});
