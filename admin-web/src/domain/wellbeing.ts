import type { Kpi, WellbeingTab } from "./types";

/** Escala del check-in (1 a 5), igual que en la app. */
export const MOOD_LABELS = ["Muy mal", "Mal", "Neutro", "Bien", "Muy bien"] as const;
export const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;
export const TABS: { id: WellbeingTab; slug: string; label: string }[] = [
  { id: "summary", slug: "resumen", label: "Resumen" },
  { id: "reasons", slug: "motivos", label: "Motivos" },
  { id: "stress", slug: "estres", label: "Estrés (PSS-10)" },
  { id: "careers", slug: "carreras", label: "Carreras" },
  { id: "participation", slug: "participacion", label: "Participación" },
];
export const MISSING = "Sin datos suficientes";

/** Pestaña desde el segmento de la URL; cualquier otro valor vuelve a «Resumen». */
export function tabFromSlug(slug: string | undefined): WellbeingTab {
  return TABS.find((t) => t.slug === slug)?.id ?? "summary";
}
export function slugOf(tab: WellbeingTab): string {
  return TABS.find((t) => t.id === tab)?.slug ?? "resumen";
}

/**
 * Estado de la escala más cercano a un promedio: 3,3 es «Neutro» y 3,5 es «Bien».
 * Describe a un grupo, no es un diagnóstico.
 */
export function moodLabel(average: number): string {
  return MOOD_LABELS[Math.min(5, Math.max(1, Math.round(average))) - 1];
}

const number = (n: number, digits: number) =>
  n.toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: digits });
/** 3,2 — siempre con un decimal, para promedios. */
export const decimal = (n: number) =>
  n.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const integer = (n: number) => number(n, 0);
/** 27 % o 27,3 %: sin decimal sobrante. */
export const percent = (n: number) => number(n, 1) + " %";

/**
 * Variación respecto al periodo anterior. `higherIsBetter` decide el tono: más participantes
 * es bueno, más días difíciles es malo; `null` para métricas sin juicio (tests hechos).
 */
export interface Delta {
  text: string;
  direction: "up" | "down" | "flat";
  tone: "good" | "bad" | "neutral";
}
export function delta(
  kpi: Kpi,
  { higherIsBetter, unit = "count" }: { higherIsBetter: boolean | null; unit?: "count" | "points" | "decimal" },
): Delta | null {
  if (kpi.value === null || kpi.previous === null) return null;
  const diff = Math.round((kpi.value - kpi.previous) * 10) / 10;
  if (diff === 0) return { text: "sin cambio", direction: "flat", tone: "neutral" };
  const direction = diff > 0 ? "up" : "down";
  const size = Math.abs(diff);
  const text = unit === "points"
    ? number(size, 1) + " pts"
    : unit === "decimal"
    ? decimal(size)
    : number(size, 1);
  const tone = higherIsBetter === null ? "neutral" : (diff > 0) === higherIsBetter ? "good" : "bad";
  return { text, direction, tone };
}

// Las fechas llegan como YYYY-MM-DD de Santiago; se formatean sin convertir de zona.
export function shortDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("es-CL", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).replace(".", "");
}
export function longDate(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Tope redondo para un eje de porcentajes: 0–20, 0–40, 0–60… nunca más de 100. */
export function percentCeiling(values: (number | null)[]): number {
  const max = Math.max(0, ...values.filter((v): v is number => v !== null));
  return Math.min(100, Math.max(20, Math.ceil(max / 20) * 20));
}
