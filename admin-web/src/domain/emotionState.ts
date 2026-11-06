import type { EmotionDistribution } from "./types";

/**
 * Estado de la escala más cercano a un promedio: 3,3 es «Neutro» y 3,5 es «Bien».
 * Las etiquetas vienen del servidor. Describe a un grupo, no es un diagnóstico.
 */
export function emotionState(average: number, scale: EmotionDistribution[]): string {
  const nearest = Math.round(average);
  return scale.find((level) => level.value === nearest)?.label ?? "";
}
