import { expect, type Page, test } from "@playwright/test";
import fs from "node:fs";
import crypto from "node:crypto";
const f = JSON.parse(
  fs.readFileSync(
    new URL("../../DuocMind/tools/.local/fixtures.json", import.meta.url),
    "utf8",
  ),
);
async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Correo institucional").fill(f.staff.email);
  await page.getByLabel("Contraseña", { exact: true }).fill(f.staff.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.getByRole("link", { name: "Eventos", exact: true }).click();
  await page.getByRole("link", { name: "Tipos de evento", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Tipos de evento", exact: true }),
  ).toBeVisible();
}
async function fillType(page: Page) {
  const code = "e2e_" + crypto.randomBytes(6).toString("hex");
  await page.getByRole("button", { name: /Nuevo tipo/ }).click();
  await page.getByLabel("Nombre del tipo").fill("Tipo " + code);
  await page.getByLabel("Código del tipo").fill(code);
  await page.getByLabel("Orden de presentación").fill("0");
  return code;
}
test("catálogo: crear, renombrar, recargar y código fijo con foco protegido", async ({ page }) => {
  await login(page);
  const code = await fillType(page);
  await page.getByRole("button", { name: "Guardar tipo", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Tipo de evento guardado",
  );
  await expect(page.getByLabel("Código del tipo")).toHaveAttribute(
    "readonly",
    "",
  );
  await page.getByRole("button", { name: "Cerrar editor" }).click();
  await expect(page.getByRole("button", { name: /Nuevo tipo/ })).toBeFocused();
  await page.getByRole("row").filter({ hasText: code }).getByRole("button", {
    name: "Editar tipo",
  }).click();
  await page.getByLabel("Nombre del tipo").fill("Renombrado " + code);
  await page.getByLabel("Orden de presentación").fill("2");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("region", { name: "Cambios sin guardar" }))
    .toBeVisible();
  await page.getByRole("button", { name: "Seguir editando" }).click();
  await page.getByRole("button", { name: "Guardar tipo", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Tipo de evento guardado",
  );
  await page.getByRole("button", { name: "Cerrar editor" }).click();
  await page.reload();
  await expect(page.getByRole("row").filter({ hasText: code })).toContainText(
    "Renombrado " + code,
  );
});
test("conflicto de tipo conserva el formulario hasta recarga explícita", async ({ page }) => {
  await login(page);
  const code = await fillType(page);
  await page.getByRole("button", { name: "Guardar tipo", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Tipo de evento guardado",
  );
  await page.getByLabel("Nombre del tipo").fill("Edición sin guardar");
  await page.route(
    "**/admin-api/event-types/*",
    (route) =>
      route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ error: "Conflicto de revisión." }),
      }),
  );
  await page.getByRole("button", { name: "Guardar tipo", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Conflicto");
  await expect(page.getByLabel("Nombre del tipo")).toHaveValue(
    "Edición sin guardar",
  );
  await page.getByRole("button", { name: "Recargar estado del tipo" }).click();
  await expect(page.getByLabel("Nombre del tipo")).toHaveValue("Tipo " + code);
});
test("respuesta perdida del catálogo reintenta sin duplicar y bloquea cierre", async ({ page }) => {
  await login(page);
  const code = await fillType(page);
  let requestId = "";
  let writes = 0;
  await page.route("**/admin-api/event-types", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }
    const payload = route.request().postDataJSON();
    if (writes++ === 0) {
      requestId = payload.requestId;
      await route.fetch();
      await route.abort();
    } else {
      expect(payload.requestId).toBe(requestId);
      await route.continue();
    }
  });
  await page.getByRole("button", { name: "Guardar tipo", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("No se pudo confirmar");
  await expect(page.getByRole("button", { name: "Cerrar editor" }))
    .toBeDisabled();
  await page.getByRole("button", { name: "Recargar estado del tipo" }).click();
  await expect(page.getByRole("button", { name: "Cerrar editor" }))
    .toBeDisabled();
  await page.getByRole("button", { name: "Guardar tipo", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Tipo de evento guardado",
  );
  await page.getByRole("button", { name: "Cerrar editor" }).click();
  await expect(page.getByRole("row").filter({ hasText: code })).toHaveCount(1);
});
test("fallo de lectura tras creación conserva identidad y evita otra creación", async ({ page }) => {
  await login(page);
  const code = await fillType(page);
  let writes = 0;
  await page.route("**/admin-api/event-types", async (route) => {
    if (route.request().method() === "POST") {
      writes++;
      await route.continue();
    } else {await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Lectura no disponible." }),
      });}
  });
  await page.getByRole("button", { name: "Guardar tipo", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("El tipo se guardó");
  await expect(page.getByLabel("Código del tipo")).toHaveAttribute(
    "readonly",
    "",
  );
  await page.getByLabel("Nombre del tipo").fill("Actualizado " + code);
  await page.getByRole("button", { name: "Guardar tipo", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("El tipo se guardó");
  expect(writes).toBe(1);
  await page.unroute("**/admin-api/event-types");
  await page.getByRole("button", { name: "Recargar estado del tipo" }).click();
  await expect(page.getByLabel("Nombre del tipo")).toHaveValue(
    "Actualizado " + code,
  );
});

async function fillEvent(page: Page, title: string) {
  await page.getByRole("button", { name: /Nuevo evento/ }).click();
  await page.getByLabel("Título del evento", { exact: true }).fill(title);
  await page.getByLabel("Lugar", { exact: true }).fill("Sede sintética");
  await page.getByLabel("Inicio").fill("2030-10-12T10:00");
  await page.getByLabel("Término").fill("2030-10-12T11:00");
}
test("evento conserva tipo al recargar, permite cambiar/quitar y cancelado queda protegido", async ({ page }) => {
  await login(page);
  const code = await fillType(page);
  await page.getByRole("button", { name: "Guardar tipo", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Tipo de evento guardado",
  );
  await page.getByRole("button", { name: "Cerrar editor" }).click();
  await page.getByRole("link", { name: "Volver a eventos" }).click();
  const title = "Evento " + crypto.randomUUID();
  await fillEvent(page, title);
  await page.getByRole("combobox", { name: "Tipo de evento", exact: true })
    .selectOption({ label: "Tipo " + code });
  await page.getByRole("button", { name: "Guardar evento", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Evento guardado");
  await page.getByRole("button", { name: "Cerrar editor" }).click();
  await page.reload();
  const row = page.getByRole("row").filter({ hasText: title });
  await expect(row).toContainText("Tipo " + code);
  await page.getByRole("link", { name: "Tipos de evento", exact: true })
    .click();
  await page.getByRole("row").filter({ hasText: code }).getByRole("button", {
    name: "Editar tipo",
  }).click();
  await page.getByLabel("Nombre del tipo").fill("Categoría " + code);
  await page.getByRole("button", { name: "Guardar tipo", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Tipo de evento guardado",
  );
  await page.getByRole("button", { name: "Cerrar editor" }).click();
  await page.getByRole("link", { name: "Volver a eventos" }).click();
  await expect(row).toContainText("Categoría " + code);
  await row.getByRole("button", { name: "Ver o editar evento" }).click();
  const selector = page.getByRole("combobox", {
    name: "Tipo de evento",
    exact: true,
  });
  await expect(selector.locator("option:checked")).toHaveText(
    "Categoría " + code,
  );
  for (const typeId of ["2", ""]) {
    await selector.selectOption(typeId);
    await page.getByRole("button", { name: "Guardar evento", exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText("Evento guardado");
    await page.getByRole("button", { name: "Recargar estado del evento" })
      .click();
    await expect(selector).toHaveValue(typeId);
  }
  await page.getByRole("button", { name: "Publicar evento", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar publicación del evento" })
    .click();
  await expect(page.getByRole("status")).toContainText("Evento publicado");
  await selector.selectOption({ label: "Categoría " + code });
  await page.getByRole("button", { name: "Guardar evento", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Evento guardado");
  await page.getByRole("button", { name: "Cancelar evento", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar cancelación" }).click();
  await expect(page.getByRole("status")).toContainText("contenido se conserva");
  await expect(selector).toBeDisabled();
  await expect(selector.locator("option:checked")).toHaveText(
    "Categoría " + code,
  );
});
test("conflicto del evento conserva la selección local de tipo", async ({ page }) => {
  await login(page);
  await page.getByRole("link", { name: "Volver a eventos" }).click();
  await fillEvent(page, "Conflicto tipo " + crypto.randomUUID());
  await page.getByRole("button", { name: "Guardar evento", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Evento guardado");
  await page.getByRole("combobox", { name: "Tipo de evento", exact: true })
    .selectOption("2");
  await page.route(
    "**/admin-api/events/*",
    (route) =>
      route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ error: "Conflicto de revisión." }),
      }),
  );
  await page.getByRole("button", { name: "Guardar evento", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Conflicto");
  await expect(
    page.getByRole("combobox", { name: "Tipo de evento", exact: true }),
  ).toHaveValue("2");
});
test("fallo del catálogo bloquea guardado y reintento conserva datos del evento", async ({ page }) => {
  await login(page);
  await page.route(
    "**/admin-api/event-types",
    (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Catálogo no disponible." }),
      }),
  );
  await page.getByRole("link", { name: "Volver a eventos" }).click();
  await expect(page.getByRole("alert")).toContainText("Catálogo no disponible");
  const title = "Reintento catálogo " + crypto.randomUUID();
  await fillEvent(page, title);
  await expect(
    page.getByRole("combobox", { name: "Tipo de evento", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Guardar evento", exact: true }),
  ).toBeDisabled();
  await page.unroute("**/admin-api/event-types");
  await page.getByRole("button", { name: "Recargar estado del evento" })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Tipo de evento", exact: true }),
  ).toBeEnabled();
  await expect(page.getByLabel("Título del evento", { exact: true }))
    .toHaveValue(title);
  await page.getByRole("combobox", { name: "Tipo de evento", exact: true })
    .selectOption("2");
  await page.getByRole("button", { name: "Guardar evento", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Evento guardado");
});
