export const FIRST_STEP = 0;

/** Avanza un paso; en el último se queda donde está. */
export function nextStep(index: number, total: number): number {
  return Math.min(index + 1, total - 1);
}

/** Retrocede un paso; en el primero se queda donde está. */
export function previousStep(index: number): number {
  return Math.max(index - 1, FIRST_STEP);
}

export function isLastStep(index: number, total: number): boolean {
  return index >= total - 1;
}

/** Texto de posición, p. ej. «Paso 2 de 6». */
export function positionLabel(index: number, total: number): string {
  return `Paso ${index + 1} de ${total}`;
}
