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
  await expect(page.getByRole("table")).toBeVisible();
}
test("respuesta perdida reintenta con UUID igual y crea un solo evento", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: "Eventos", exact: true }).click();
  await page.getByRole("button", { name: /Nuevo evento/ }).click();
  const title = "Respuesta perdida " + crypto.randomUUID();
  await page.getByLabel("Título del evento").fill(title);
  await page.getByLabel("Lugar", { exact: true }).fill("Local");
  await page.getByLabel("Inicio en Santiago").fill("2026-10-04T10:00");
  await page.getByLabel("Término en Santiago").fill("2026-10-04T11:00");
  let id = "";
  let seen = 0;
  await page.route("**/admin-api/events", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    const payload = route.request().postDataJSON();
    if (seen === 0) {
      id = payload.requestId;
      await route.fetch();
      await route.abort();
    } else {
      expect(payload.requestId).toEqual(id);
      await route.continue();
    }
    seen++;
  });
  await page.getByRole("button", { name: "Guardar evento", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("No se pudo confirmar");
  await expect(page.getByLabel("Título del evento")).toHaveValue(title);
  await page.getByRole("button", { name: "Guardar evento", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Evento guardado");
  await expect(page.getByRole("button", { name: "Cerrar editor" }))
    .toBeEnabled();
  await page.getByRole("button", { name: "Cerrar editor" }).click();
  await expect(page.getByRole("row").filter({ hasText: title }))
    .toHaveCount(1);
});
test("teclado, etiquetas y respuesta 403 limpian los datos del alumno", async ({ page }) => {
  await page.goto("/login");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Correo institucional")).toBeFocused();
  await login(page);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Ir al contenido" }))
    .toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  const unlabeled = await page.locator("input,select,textarea").evaluateAll(
    (elements) =>
      elements.filter((e) =>
        !((e as HTMLInputElement).labels?.length ||
          e.getAttribute("aria-label") || e.getAttribute("aria-labelledby"))
      ).length,
  );
  expect(unlabeled).toBe(0);
  await page.screenshot({
    path: "test-results/admin-panel.png",
    fullPage: true,
  });
  await page.route(
    "**/admin-api/students?*",
    (route) =>
      route.fulfill({
        status: 403,
        contentType: "text/plain",
        body: "Sin autorización.",
      }),
  );
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Iniciar sesión" }))
    .toBeVisible();
  await expect(page.getByRole("table")).not.toBeVisible();
});
