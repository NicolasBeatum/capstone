import type { Instrument, ScaleOption, TestQuestion, TestResult } from './types';

const PERIOD = 'Durante las últimas dos semanas, ¿con qué frecuencia le han afectado los siguientes problemas?';

export const gad7Questions: TestQuestion[] = [
  { id: 1, title: 'Sentirse nervioso(a), ansioso(a) o muy alterado(a)', helper: PERIOD },
  { id: 2, title: 'No poder impedir o controlar las preocupaciones', helper: PERIOD },
  { id: 3, title: 'Preocuparse demasiado por diferentes cosas', helper: PERIOD },
  { id: 4, title: 'Tener dificultad para relajarse', helper: PERIOD },
  { id: 5, title: 'Sentirse inquieto(a) y tener dificultad para estarse quieto(a)', helper: PERIOD },
  { id: 6, title: 'Irritarse o enfadarse con facilidad', helper: PERIOD },
  { id: 7, title: 'Sentir miedo, como si algo terrible fuera a pasar', helper: PERIOD },
];

export const gad7Options: ScaleOption[] = [
  { label: 'Nunca', value: 0 },
  { label: 'Varios días', value: 1 },
  { label: 'Más de la mitad de los días', value: 2 },
  { label: 'Casi todos los días', value: 3 },
];

interface Gad7Range {
  min: number;
  max: number;
  category: string;
  categoryLabel: string;
}

const GAD7_RANGES: Gad7Range[] = [
  { min: 0, max: 4, category: 'minimo', categoryLabel: 'Ansiedad mínima' },
  { min: 5, max: 9, category: 'leve', categoryLabel: 'Ansiedad leve' },
  { min: 10, max: 14, category: 'moderado', categoryLabel: 'Ansiedad moderada' },
  { min: 15, max: 21, category: 'severo', categoryLabel: 'Ansiedad severa' },
];

export function gad7Score(answers: Record<number, number>): TestResult {
  const raw = gad7Questions.reduce((total, question) => total + (answers[question.id] ?? 0), 0);
  const range = GAD7_RANGES.find((item) => raw >= item.min && raw <= item.max) ?? GAD7_RANGES[0];

  return {
    score: raw,
    maxScore: 21,
    category: range.category,
    categoryLabel: range.categoryLabel,
  };
}

export const gad7: Instrument = {
  id: 'gad7',
  name: 'GAD-7 · Ansiedad',
  eyebrow: 'TEST DE ANSIEDAD (GAD-7)',
  questions: gad7Questions,
  options: gad7Options,
  interpretation: {
    minimo: 'No se registran síntomas de ansiedad significativos en las últimas dos semanas.',
    leve: 'Síntomas de ansiedad leves. Mantener hábitos de descanso y pausas activas ayuda a mantenerlos a raya.',
    moderado: 'Síntomas de ansiedad moderados. Conversemos con el área de bienestar para revisar cómo apoyarte.',
    severo: 'Síntomas de ansiedad severos. Te recomendamos contactar al área de bienestar estudiantil cuanto antes.',
  },
  score: gad7Score,
};
