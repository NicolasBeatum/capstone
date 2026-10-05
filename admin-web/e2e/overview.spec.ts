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
  await expect(page.getByRole("heading", { name: "Alumnos", exact: true }))
    .toBeVisible();
}
test("dashboard refleja registro real sin consultar información emocional", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  const requests: string[] = [];
  page.on("request", (r) => {
    const path = new URL(r.url()).pathname;
    if (path.includes("/admin-api/")) {
      requests.push(path.split("/admin-api")[1]);
    }
  });
  const response = page.waitForResponse((r) =>
    r.url().includes("/admin-api/students?") &&
    r.url().includes("pageSize=5") && r.request().method() === "GET"
  );
  await page.getByRole("navigation", { name: "Administración", exact: true })
    .getByRole("link", { name: "Dashboard", exact: true }).click();
  const data = await (await response).json();
  await expect(
    page.getByRole("heading", { name: "Dashboard de Bienestar y Salud" }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Alumnos registrados", exact: true })
      .getByText(String(data.total), { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Compartición voluntaria" }).getByText(
      "Pendiente de habilitar",
      { exact: true },
    ),
  ).toBeVisible();
  expect(requests.every((path) => ["/students", "/catalogs"].includes(path)))
    .toBe(true);
  await page.screenshot({
    path: "test-results/dashboard-overview.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(() =>
      document.documentElement.scrollWidth <= window.innerWidth
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
  });
});
test("fallo y revocación de sesión no dejan métricas o alumnos visibles", async ({ page }) => {
  await login(page);
  await page.route(
    "**/admin-api/students?*",
    (r) =>
      r.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "Servicio no disponible." }),
      }),
  );
  await page.goto("/overview");
  await expect(page.getByRole("alert")).toContainText("Servicio no disponible");
  await expect(
    page.getByRole("region", { name: "Alumnos registrados", exact: true })
      .getByText("—", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  await page.unroute("**/admin-api/students?*");
  await page.getByRole("button", { name: "Actualizar resumen" }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await page.route(
    "**/admin-api/students?*",
    (r) =>
      r.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ error: "Sin autorización." }),
      }),
  );
  await page.getByRole("button", { name: "Actualizar resumen" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "Alumnos registrados", exact: true }),
  ).toHaveCount(0);
});
