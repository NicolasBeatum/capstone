import type { Instrument, ScaleOption, TestQuestion, TestResult } from './types';

const PERIOD = 'Considera cómo te has sentido durante las últimas dos semanas.';

export const who5Questions: TestQuestion[] = [
  { id: 1, title: 'Me he sentido alegre y de buen humor', helper: PERIOD },
  { id: 2, title: 'Me he sentido calmado(a) y relajado(a)', helper: PERIOD },
  { id: 3, title: 'Me he sentido activo(a) y con energía', helper: PERIOD },
  { id: 4, title: 'Me he despertado sintiéndome fresco(a) y descansado(a)', helper: PERIOD },
  { id: 5, title: 'Mi vida diaria ha estado llena de cosas que me interesan', helper: PERIOD },
];

export const who5Options: ScaleOption[] = [
  { label: 'En ningún momento', value: 0 },
  { label: 'Rara vez', value: 1 },
  { label: 'Algunas veces', value: 2 },
  { label: 'A menudo', value: 3 },
  { label: 'La mayor parte del tiempo', value: 4 },
  { label: 'Todo el tiempo', value: 5 },
];

/**
 * WHO-5: suma de ítems (0-25) multiplicada por 4 = porcentaje de bienestar (0-100).
 * Un puntaje <= 50 indica bajo bienestar y es motivo de seguimiento (corte validado OMS).
 */
export function who5Score(answers: Record<number, number>): TestResult {
  const raw = who5Questions.reduce((total, question) => total + (answers[question.id] ?? 0), 0);
  const percentage = raw * 4;
  const low = percentage <= 50;

  return {
    score: raw,
    maxScore: 25,
    percentage,
    category: low ? 'bajo' : 'aceptable',
    categoryLabel: low ? 'Bienestar bajo' : 'Bienestar aceptable',
  };
}

export const who5: Instrument = {
  id: 'who5',
  name: 'WHO-5 · Bienestar',
  eyebrow: 'TEST DE BIENESTAR',
  questions: who5Questions,
  options: who5Options,
  interpretation: {
    bajo:
      'Un puntaje igual o inferior a 50 indica bajo bienestar. Es un buen momento para hacer seguimiento de cómo te sientes.',
    aceptable: 'Tu bienestar percibido se encuentra en un nivel aceptable. ¡Sigue cuidando tus hábitos!',
  },
  score: who5Score,
};
