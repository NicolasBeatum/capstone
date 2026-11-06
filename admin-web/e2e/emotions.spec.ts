import { expect, type Page, test } from "@playwright/test";
import fs from "node:fs";
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
  await expect(page.getByRole("heading", { name: "Alumnos", exact: true }))
    .toBeVisible();
}
const distribution = [
  ["Muy mal", 3],
  ["Mal", 6],
  ["Neutro", 20],
  ["Bien", 19],
  ["Muy bien", 10],
].map(([label, checkins], i) => ({ value: i + 1, label, checkins }));
const sufficient = (days: number) => ({
  days,
  from: "2026-10-08",
  to: "2026-11-06",
  minGroupSize: 5,
  sufficient: true,
  participants: 12,
  checkins: 58,
  average: 3.4,
  distribution,
  weekly: [
    { weekStart: "2026-10-05", participants: 7, average: 3.2 },
    { weekStart: "2026-10-12", participants: null, average: null },
    { weekStart: "2026-10-19", participants: 9, average: 3.6 },
    { weekStart: "2026-10-26", participants: 8, average: 3.3 },
    { weekStart: "2026-11-02", participants: 10, average: 3.8 },
  ],
  careers: [
    { name: "Enfermería", participants: 6, average: 3.5 },
    { name: "Informática", participants: 5, average: 3.1 },
    { name: "Otras carreras", participants: 6, average: 3.6 },
  ],
});
const insufficient = (days: number) => ({
  days,
  from: "2026-10-08",
  to: "2026-11-06",
  minGroupSize: 5,
  sufficient: false,
  participants: null,
  checkins: null,
  average: null,
  distribution: [],
  weekly: [],
  careers: [],
});
// React StrictMode (solo en desarrollo) monta dos veces: se colapsan peticiones consecutivas iguales.
const distinct = (values: string[]) =>
  values.filter((v, i) => i === 0 || v !== values[i - 1]);
async function mock(
  page: Page,
  build: (days: number) => unknown,
  seen: string[] = [],
) {
  await page.route("**/admin-api/emotions?*", (route) => {
    const days = Number(new URL(route.request().url()).searchParams.get("days"));
    seen.push(String(days));
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(build(days)),
    });
  });
}
const openEmotions = async (page: Page) => {
  await page.getByRole("navigation", { name: "Administración", exact: true })
    .getByRole("link", { name: "Emociones", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Emociones", level: 1 }))
    .toBeVisible();
};

test("muestra datos agregados, tablas accesibles y semanas sin datos como vacío", async ({ page }) => {
  const seen: string[] = [];
  await mock(page, sufficient, seen);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  await openEmotions(page);
  await expect(page).toHaveURL(/\/emotions$/);
  await expect(page.getByText("Datos agregados y voluntarios.")).toBeVisible();
  await expect(page.getByText("valor diagnóstico")).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Estudiantes participantes" }).getByText("12", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("region", { name: "Registros" }).getByText("58", { exact: true }))
    .toBeVisible();
  const averageCard = page.getByRole("region", { name: "Promedio", exact: true });
  await expect(averageCard.getByText("Neutro", { exact: true })).toBeVisible();
  await expect(averageCard.getByText("3,4 en una escala de 1 a 5")).toBeVisible();
  expect(distinct(seen)).toEqual(["30"]);
  // Tabla de la tendencia: la semana sin datos suficientes no es un 0.
  const trend = page.getByRole("region", { name: "Tendencia semanal" });
  await trend.getByText("Ver como tabla").click();
  const weekRow = trend.getByRole("row", { name: /12 oct/ });
  await expect(weekRow).toContainText("Sin datos suficientes");
  await expect(weekRow).not.toContainText(/\b0\b/);
  expect(await trend.locator("circle.trend-point").count()).toBe(4);
  await expect(page.getByRole("region", { name: "Cómo se distribuyen los registros" }).getByText("Ver como tabla"))
    .toBeVisible();
  // Carreras en orden alfabético y «Otras carreras» al final.
  const careers = page.getByRole("region", { name: "Promedio por carrera" });
  await careers.getByText("Ver como tabla").click();
  const names = await careers.locator("tbody th").allTextContents();
  expect(names).toEqual(["Enfermería", "Informática", "Otras carreras"]);
  // El promedio se lee como estado: 3,5 es «Bien» y 3,1 es «Neutro».
  await expect(careers.getByRole("row", { name: /Enfermería/ }).getByRole("cell", { name: "Bien" })).toBeVisible();
  await expect(careers.getByRole("row", { name: /Informática/ }).getByRole("cell", { name: "Neutro" })).toBeVisible();
  // Nada de los datos se guarda en el navegador.
  const stored = await page.evaluate(() =>
    JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage })
  );
  expect(stored).not.toContain("Otras carreras");
  expect(stored).not.toContain("Enfermería");
  await page.screenshot({ path: "test-results/emotions-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  await page.screenshot({ path: "test-results/emotions-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Últimos 7 días" }).click();
  await expect(page.getByRole("button", { name: "Últimos 7 días" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect.poll(() => distinct(seen)).toEqual(["30", "7"]);
});

test("datos insuficientes: sin valores parciales ni cuántas personas hay", async ({ page }) => {
  await mock(page, insufficient);
  await login(page);
  await openEmotions(page);
  const empty = page.getByRole("status", { name: "Datos insuficientes" });
  await expect(empty).toContainText("Aún no hay datos suficientes");
  await expect(empty).not.toContainText(/\d/);
  await expect(page.getByRole("region", { name: "Estudiantes participantes" })).toHaveCount(0);
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page.getByText("Tendencia semanal")).toHaveCount(0);
  await expect(page.getByText("Datos agregados y voluntarios.")).toBeVisible();
  await page.screenshot({ path: "test-results/emotions-insufficient.png", fullPage: true });
});

test("se opera solo con teclado", async ({ page }) => {
  const seen: string[] = [];
  await mock(page, sufficient, seen);
  await login(page);
  await openEmotions(page);
  await expect(page.getByRole("region", { name: "Tendencia semanal" })).toBeVisible();
  const ninety = page.getByRole("button", { name: "Últimos 90 días" });
  await ninety.focus();
  await expect(ninety).toBeFocused();
  await page.keyboard.press("Enter");
  await expect.poll(() => distinct(seen)).toEqual(["30", "90"]);
  await expect(ninety).toHaveAttribute("aria-pressed", "true");
  const summary = page.getByRole("region", { name: "Cómo se distribuyen los registros" })
    .getByText("Ver como tabla");
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("table", { name: "Registros por emoción" })).toBeVisible();
  // Los puntos de la tendencia reciben el foco y anuncian su valor.
  const point = page.locator("circle.trend-point").first();
  await point.focus();
  await expect(point).toBeFocused();
  await expect(point).toHaveAttribute("aria-label", /Neutro, promedio 3,2/);
});

test("una respuesta con identificadores se rechaza completa", async ({ page }) => {
  await mock(page, (days) => ({ ...sufficient(days), studentId: "42" }));
  await login(page);
  await openEmotions(page);
  await expect(page.getByRole("alert")).toContainText("Respuesta del servidor inválida");
  await expect(page.getByRole("region", { name: "Estudiantes participantes" })).toHaveCount(0);
  await expect(page.getByRole("table")).toHaveCount(0);
});

test("contra el backend local la página carga sin error", async ({ page }) => {
  await login(page);
  await openEmotions(page);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(
    page.getByRole("status", { name: "Datos insuficientes" }).or(
      page.getByRole("region", { name: "Estudiantes participantes" }),
    ),
  ).toBeVisible();
});
