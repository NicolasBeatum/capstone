import { shortDate } from "../../domain/wellbeing";

/** Escala lineal de [d0, d1] a [r0, r1]. */
export function linear(d0: number, d1: number, r0: number, r1: number) {
  return (v: number) => r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);
}
/** Etiqueta de semana: se muestra una de cada tantas para que no se encimen (máx. 7). */
export function weekTicks(labels: string[]) {
  const every = Math.ceil(labels.length / 7);
  return (i: number) => (i % every === 0 ? shortDate(labels[i]) : null);
}
