import { expect, type Page, test } from "@playwright/test";
import fs from "node:fs";
// Spec 023, CA-009: cada pestaña con datos, con estado insuficiente y con su tabla accesible.
// Las respuestas se simulan con datos sintéticos; el backend real se prueba en tools/tests.
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
  await expect(page.getByRole("heading", { name: "Alumnos", exact: true })).toBeVisible();
}

const WEEKS = ["2026-10-12", "2026-10-19", "2026-10-26", "2026-11-02", "2026-11-09"];
const header = (days: number, careerId: string | null, sufficient = true) => ({
  days,
  from: "2026-10-17",
  to: "2026-11-15",
  minGroupSize: 5,
  careerId,
  sufficient,
});
const k = (value: number | null, previous: number | null = null) => ({ value, previous });
const tabs: Record<string, (days: number, careerId: string | null) => unknown> = {
  summary: (days, careerId) => ({
    ...header(days, careerId),
    participants: k(45, 42),
    checkins: k(683, 683),
    average: k(3, 3.2),
    difficultShare: k(31, 25.3),
    testTaken: k(36, 27),
    highStressShare: k(null),
    weekly: WEEKS.map((weekStart, i) => ({
      weekStart,
      average: i === 1 ? null : 3 + i / 10,
      distribution: i === 1 ? [null, null, null, null, null] : [8, 22, 40, 20, 10],
    })),
    weekdays: [2.4, 3.3, 3.2, 3.2, 3.2, 3.4, null].map((average, i) => ({ day: i + 1, average })),
    topReasons: [{ name: "Académico", share: 22.8 }, { name: "Familia", share: 20.2 }],
  }),
  reasons: (days, careerId) => ({
    ...header(days, careerId),
    ranking: [
      { name: "Académico", share: 42.9, average: 2.1 },
      { name: "Familia", share: 30, average: 3.6 },
      { name: "Otros motivos", share: 12, average: 3.1 },
    ],
    matrix: [
      { name: "Académico", cells: [10, 44, 23, 18, 5] },
      { name: "Familia", cells: [2, 10, 44, 34, 10] },
      { name: "Otros motivos", cells: [null, null, null, null, null] },
    ],
    trend: [
      { name: "Académico", weeks: WEEKS.map((weekStart, i) => ({ weekStart, share: i === 1 ? null : 20 + i })) },
      { name: "Familia", weeks: WEEKS.map((weekStart) => ({ weekStart, share: 18 })) },
    ],
  }),
  stress: (days, careerId) => ({
    ...header(days, careerId),
    participants: k(41),
    average: k(18, 16.5),
    highShare: k(14.6, 10),
    levels: [
      { level: "leve", label: "Estrés leve", students: 10 },
      { level: "moderado", label: "Estrés moderado", students: 25 },
      { level: "severo", label: "Estrés severo", students: 6 },
    ],
    weekly: WEEKS.map((weekStart, i) => ({ weekStart, average: i % 2 ? null : 18, highShare: i % 2 ? null : 15 })),
    careers: [
      { name: "Informática", average: 15.4, highShare: 0 },
      { name: "Otras carreras", average: null, highShare: null },
    ],
  }),
  careers: (days, careerId) => ({
    ...header(days, careerId),
    rows: [
      { name: "Informática", participants: 14, average: 3, difficultShare: 33.4, highStressShare: 0, topReason: "Académico" },
      { name: "Otras carreras", participants: 11, average: 3.1, difficultShare: 28.6, highStressShare: null, topReason: null },
    ],
  }),
  participation: (days, careerId) => ({
    ...header(days, careerId),
    registered: 65,
    sharingShare: 70.8,
    active: k(45, 40),
    checkinsPerParticipant: k(46.6),
    weekly: WEEKS.map((weekStart, i) => ({ weekStart, active: i === 1 ? null : 40 })),
  }),
};
const empty: Record<string, Record<string, unknown>> = {
  summary: {
    participants: k(null), checkins: k(null), average: k(null), difficultShare: k(null), testTaken: k(null),
    highStressShare: k(null), weekly: [], weekdays: [], topReasons: [],
  },
  reasons: { ranking: [], matrix: [], trend: [] },
  stress: { participants: k(null), average: k(null), highShare: k(null), levels: [], weekly: [], careers: [] },
  careers: { rows: [] },
  participation: { registered: null, sharingShare: null, active: k(null), checkinsPerParticipant: k(null), weekly: [] },
};

// React StrictMode (solo en desarrollo) monta dos veces: se colapsan peticiones consecutivas iguales.
const distinct = (values: string[]) => values.filter((v, i) => i === 0 || v !== values[i - 1]);
async function mock(page: Page, { sufficient = true, seen = [] as string[], broken = false } = {}) {
  await page.route("**/admin-api/wellbeing/**", (route) => {
    const url = new URL(route.request().url());
    const tab = url.pathname.split("/").at(-1) as string;
    const days = Number(url.searchParams.get("days"));
    const careerId = url.searchParams.get("careerId");
    if (tab === "careers-available") {
      return route.fulfill({
        json: { ...header(days, null), careers: [{ id: "12", name: "Informática" }, { id: "14", name: "Enfermería" }] },
      });
    }
    seen.push(`${tab}?days=${days}${careerId ? "&careerId=" + careerId : ""}`);
    const body = sufficient ? tabs[tab](days, careerId) : { ...header(days, careerId, false), ...empty[tab] };
    return route.fulfill({ json: broken ? { ...(body as object), studentId: "1" } : body });
  });
}
const openWellbeing = async (page: Page) => {
  await page.getByRole("navigation", { name: "Administración", exact: true })
    .getByRole("link", { name: "Bienestar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Bienestar estudiantil" })).toBeVisible();
};
const sections = (page: Page) => page.getByRole("navigation", { name: "Secciones del dashboard" });

test("cada pestaña muestra sus datos y su tabla accesible, con la pestaña en la URL", async ({ page }) => {
  const seen: string[] = [];
  await mock(page, { seen });
  await login(page);
  await openWellbeing(page);
  await expect(page).toHaveURL(/\/wellbeing\/resumen$/);

  // Resumen
  await expect(page.getByRole("region", { name: "Participantes", exact: true })).toContainText("45");
  await expect(page.getByRole("region", { name: "Ánimo promedio", exact: true })).toContainText("Neutro");
  await expect(page.getByRole("region", { name: "Estrés alto", exact: true })).toContainText("Sin datos suficientes");
  const trend = page.getByRole("region", { name: "Ánimo promedio por semana" });
  await trend.getByText("Ver como tabla").click();
  await expect(trend.getByRole("table")).toContainText("Sin datos suficientes");
  await expect(page.getByRole("region", { name: "Lo más mencionado" })).toContainText("Académico");

  // Motivos
  await sections(page).getByRole("link", { name: "Motivos" }).click();
  await expect(page).toHaveURL(/\/wellbeing\/motivos$/);
  const matrix = page.getByRole("region", { name: "Emociones dentro de cada motivo" });
  await matrix.getByText("Ver como tabla").click();
  await expect(matrix.getByRole("row", { name: /Otros motivos/ })).toContainText("Sin datos suficientes");
  await expect(page.getByRole("region", { name: "Ánimo promedio según el motivo" })).toContainText("Académico");

  // Estrés
  await sections(page).getByRole("link", { name: "Estrés (PSS-10)" }).click();
  await expect(page.getByRole("region", { name: "Estudiantes con test" })).toContainText("41");
  const levels = page.getByRole("region", { name: "Distribución por nivel" });
  await levels.getByText("Ver como tabla").click();
  await expect(levels.getByRole("row", { name: /Estrés moderado/ })).toContainText("25");

  // Carreras
  await sections(page).getByRole("link", { name: "Carreras" }).click();
  const table = page.getByRole("table");
  await expect(table.getByRole("row", { name: /Otras carreras/ })).toContainText("menos de 5 tests");
  await expect(table.getByRole("row", { name: /Informática/ })).toContainText("Académico");

  // Participación
  await sections(page).getByRole("link", { name: "Participación" }).click();
  await expect(page.getByRole("region", { name: "Comparten datos anónimos" })).toContainText("70,8 %");
  const active = page.getByRole("region", { name: "Participantes activos por semana" });
  await active.getByText("Ver como tabla").click();
  await expect(active.getByRole("table")).toContainText("Sin datos suficientes");

  // Volver a una pestaña ya vista no repite la petición; recargar conserva la pestaña.
  await sections(page).getByRole("link", { name: "Resumen" }).click();
  await expect(page.getByRole("region", { name: "Participantes", exact: true })).toContainText("45");
  expect(distinct(seen)).toEqual([
    "summary?days=30", "reasons?days=30", "stress?days=30", "careers?days=30", "participation?days=30",
  ]);
  await sections(page).getByRole("link", { name: "Motivos" }).click();
  await page.reload();
  await expect(page).toHaveURL(/\/wellbeing\/motivos$/);
  await expect(page.getByRole("region", { name: "Motivos más frecuentes" })).toBeVisible();
});

test("periodo y carrera se aplican a todas las pestañas", async ({ page }) => {
  const seen: string[] = [];
  await mock(page, { seen });
  await login(page);
  await openWellbeing(page);
  await page.getByRole("button", { name: "90 días" }).click();
  await expect(page.getByRole("button", { name: "90 días" })).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Carrera").selectOption({ label: "Informática" });
  await expect.poll(() => seen.at(-1)).toBe("summary?days=90&careerId=12");
  for (const [name, tab] of [["Motivos", "reasons"], ["Estrés (PSS-10)", "stress"], ["Carreras", "careers"], ["Participación", "participation"]]) {
    await sections(page).getByRole("link", { name }).click();
    await expect.poll(() => seen.at(-1)).toBe(`${tab}?days=90&careerId=12`);
  }
});

test("sin datos suficientes no se muestra ningún valor parcial", async ({ page }) => {
  await mock(page, { sufficient: false });
  await login(page);
  await openWellbeing(page);
  for (const name of ["Resumen", "Motivos", "Estrés (PSS-10)", "Carreras", "Participación"]) {
    await sections(page).getByRole("link", { name }).click();
    await expect(page.getByRole("status", { name: "Datos insuficientes" })).toContainText("Aún no hay datos suficientes");
    await expect(page.locator(".chart")).toHaveCount(0);
  }
});

test("los gráficos se recorren con teclado y muestran el detalle", async ({ page }) => {
  await mock(page);
  await login(page);
  await openWellbeing(page);
  const trend = page.getByRole("region", { name: "Ánimo promedio por semana" });
  const point = trend.getByRole("img", { name: /Semana del 12 oct/ });
  await point.focus();
  await expect(point).toBeFocused();
  await expect(trend.locator(".chart-tip")).toContainText("Ánimo: Neutro (3,0)");
  await page.keyboard.press("Tab");
  await expect(trend.locator(".chart-tip")).toContainText("Semana del 26 oct");
});

test("una respuesta con campos de más se rechaza y se puede reintentar", async ({ page }) => {
  await mock(page, { broken: true });
  await login(page);
  await openWellbeing(page);
  await expect(page.getByRole("alert")).toContainText("Respuesta del servidor inválida.");
  await expect(page.getByText("45")).toHaveCount(0);
  await page.unroute("**/admin-api/wellbeing/**");
  await mock(page);
  await page.getByRole("button", { name: "Reintentar" }).click();
  await expect(page.getByRole("region", { name: "Participantes", exact: true })).toContainText("45");
});

test("/emotions redirige a Bienestar", async ({ page }) => {
  await mock(page);
  await login(page);
  await page.goto("/emotions");
  await expect(page).toHaveURL(/\/wellbeing\/resumen$/);
  await expect(page.getByRole("heading", { name: "Bienestar estudiantil" })).toBeVisible();
});

test("cada gráfico tiene un botón «i» que explica qué muestra", async ({ page }) => {
  await mock(page);
  await login(page);
  await openWellbeing(page);
  await expect(page.getByRole("button", { name: /^Qué muestra «/ })).toHaveCount(4);
  const trend = page.getByRole("region", { name: "Ánimo promedio por semana" });
  const button = trend.getByRole("button", { name: "Qué muestra «Ánimo promedio por semana»" });
  const tip = trend.getByRole("tooltip");
  await expect(tip).toBeHidden();
  // Al pasar el mouse se abre y al salir se cierra.
  await button.hover();
  await expect(tip).toContainText("Qué muestra.");
  await expect(tip).toContainText("Cómo se calcula.");
  await page.mouse.move(0, 0);
  await expect(tip).toBeHidden();
  // Con teclado se abre al enfocar y Escape la cierra.
  await button.focus();
  await expect(tip).toBeVisible();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(tip).toBeHidden();
  // Un clic la deja fija; otro clic la cierra.
  await button.click();
  await page.mouse.move(0, 0);
  await expect(tip).toBeVisible();
  await button.click();
  await page.mouse.move(0, 0);
  await expect(tip).toBeHidden();
  await sections(page).getByRole("link", { name: "Carreras" }).click();
  await expect(page.getByRole("button", { name: "Qué muestra «Comparación por carrera»" })).toBeVisible();
});
