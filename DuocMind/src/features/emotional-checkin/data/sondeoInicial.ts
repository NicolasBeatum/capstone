import type { Instrument, ScaleOption, TestQuestion, TestResult } from './types';

const PERIOD = 'Durante las últimas dos semanas';

export const sondeoQuestions: TestQuestion[] = [
  { id: 1, title: '¿Has tenido poco interés o placer en hacer cosas?', helper: PERIOD },
  { id: 2, title: '¿Te has sentido decaído(a), deprimido(a) o sin esperanzas?', helper: PERIOD },
  { id: 3, title: '¿Te has sentido nervioso(a), ansioso(a) o muy alterado(a)?', helper: PERIOD },
];

export const sondeoOptions: ScaleOption[] = [
  { label: 'Nunca', value: 0 },
  { label: 'Varios días', value: 1 },
  { label: 'Más de la mitad de los días', value: 2 },
  { label: 'Casi todos los días', value: 3 },
];

export interface SondeoResult extends TestResult {
  /** Subescala de ánimo (PHQ-2): ítems 1 + 2, rango 0-6 */
  depressionScore: number;
  /** Subescala de ansiedad (GAD-2, 1 ítem en este sondeo): ítem 3, rango 0-3 */
  anxietyScore: number;
}

export function sondeoScore(answers: Record<number, number>): SondeoResult {
  const depressionScore = (answers[1] ?? 0) + (answers[2] ?? 0);
  const anxietyScore = answers[3] ?? 0;
  const score = depressionScore + anxietyScore;

  return {
    score,
    maxScore: 9,
    depressionScore,
    anxietyScore,
    category: 'sin_alerta',
    categoryLabel: 'Sin señales de alerta',
  };
}

export const sondeoInicial: Instrument = {
  id: 'sondeo',
  name: 'Sondeo inicial',
  eyebrow: 'SONDEO INICIAL',
  questions: sondeoQuestions,
  options: sondeoOptions,
  interpretation: {
    sin_alerta: 'Tus respuestas no muestran señales que ameriten una evaluación adicional hoy.',
  },
  score: sondeoScore,
};
