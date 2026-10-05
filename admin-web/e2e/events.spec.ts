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
  await page.getByRole("link", { name: "Eventos", exact: true }).click();
}
test("crear, publicar y cancelar evento conserva contenido", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: /Nuevo evento/ }).click();
  await page.getByLabel("Título del evento", { exact: true }).fill(
    "Feria sintética " + crypto.randomUUID(),
  );
  await page.getByRole("textbox", {
    name: "Descripción del evento",
    exact: true,
  }).fill("Actividad institucional");
  await page.getByLabel("Lugar", { exact: true }).fill("Sede sintética");
  await page.getByLabel("Inicio en Santiago").fill("2026-10-04T10:00");
  await page.getByLabel("Término en Santiago").fill("2026-10-04T12:00");
  await page.getByRole("button", { name: "Guardar evento" }).click();
  await expect(page.getByRole("status")).toContainText("Evento guardado");
  await page.getByRole("button", { name: "Publicar evento", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar publicación del evento" })
    .click();
  await expect(page.getByRole("status")).toContainText("Evento publicado");
  await page.getByRole("button", { name: "Cancelar evento", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar cancelación" }).click();
  await expect(page.getByRole("status")).toContainText("contenido se conserva");
  await expect(
    page.getByRole("textbox", { name: "Descripción del evento", exact: true }),
  ).toHaveValue("Actividad institucional");
  await expect(page.getByRole("button", { name: "Guardar evento" }))
    .toBeDisabled();
});
test("hora inexistente se rechaza; conflicto conserva formulario", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: /Nuevo evento/ }).click();
  await page.getByLabel("Título del evento", { exact: true }).fill(
    "Fixture hora " + crypto.randomUUID(),
  );
  await page.getByLabel("Lugar", { exact: true }).fill("Sede");
  await page.getByLabel("Inicio en Santiago").fill("2026-09-06T00:30");
  await page.getByLabel("Término en Santiago").fill("2026-09-06T02:00");
  await page.getByRole("button", { name: "Guardar evento" }).click();
  await expect(page.getByRole("alert")).toContainText("no existe");
  await page.getByLabel("Inicio en Santiago").fill("2026-09-06T01:30");
  await page.getByRole("button", { name: "Guardar evento" }).click();
  await expect(page.getByRole("status")).toContainText("Evento guardado");
  await page.getByLabel("Lugar", { exact: true }).fill("Edición local");
  await page.route(
    "**/admin-api/events/*",
    (route) =>
      route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({ error: "Conflicto de revisión." }),
      }),
  );
  await page.getByRole("button", { name: "Guardar evento" }).click();
  await expect(page.getByRole("alert")).toContainText("Conflicto");
  await expect(page.getByLabel("Lugar", { exact: true })).toHaveValue(
    "Edición local",
  );
});
