import type { TestContent } from "./types";
export function validatePublication(content: TestContent): string | null {
  if (!content.title.trim() || !content.questions.length) {
    return "Añade un título y al menos una pregunta.";
  }
  let minimum = 0, maximum = 0;
  for (const q of content.questions) {
    if (!q.text.trim() || q.options.length < 2) {
      return "Cada pregunta requiere texto y al menos dos opciones.";
    }
    if (
      q.options.some((o) =>
        !o.text.trim() || !Number.isInteger(o.score) || o.score < 0 ||
        o.score > 1000
      ) || new Set(q.options.map((o) => o.text)).size !== q.options.length ||
      new Set(q.options.map((o) => o.score)).size !== q.options.length
    ) {
      return "Las opciones requieren textos y puntajes únicos, enteros y no negativos.";
    }
    minimum += Math.min(...q.options.map((o) => o.score));
    maximum += Math.max(...q.options.map((o) => o.score));
  }
  if (
    !content.levels.length ||
    new Set(content.levels.map((l) => l.key)).size !== content.levels.length
  ) return "Añade niveles con claves únicas.";
  let expected = minimum;
  for (const l of [...content.levels].sort((a, b) => a.min - b.min)) {
    if (
      !/^[a-z][a-z0-9_]*$/.test(l.key) || !l.label.trim() ||
      !l.content.trim() || !Number.isInteger(l.min) ||
      !Number.isInteger(l.max) || l.min !== expected || l.max < l.min
    ) {
      return "Los niveles necesitan orientación y rangos completos sin huecos ni solapamientos.";
    }
    expected = l.max + 1;
  }
  return expected === maximum + 1
    ? null
    : "Los niveles deben cubrir el mínimo y el máximo posibles.";
}
export function previewResult(
  content: TestContent,
  answers: Record<number, number>,
) {
  if (content.questions.some((_q, i) => answers[i] === undefined)) return null;
  const score = content.questions.reduce((sum, _q, i) => sum + answers[i], 0);
  return {
    score,
    level: content.levels.find((l) => score >= l.min && score <= l.max) ?? null,
  };
}
