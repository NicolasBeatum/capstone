import type { Instrument, ScaleOption, TestQuestion, TestResult } from './types';

export const PHQ9_ITEM9_ID = 9;

const PERIOD = 'Durante las últimas dos semanas, ¿con qué frecuencia le han afectado los siguientes problemas?';

export const phq9Questions: TestQuestion[] = [
  { id: 1, title: 'Poco interés o placer en hacer cosas', helper: PERIOD },
  { id: 2, title: 'Sentirse decaído(a), deprimido(a) o sin esperanzas', helper: PERIOD },
  { id: 3, title: 'Tener dificultad para quedarse o permanecer dormido(a), o dormir demasiado', helper: PERIOD },
  { id: 4, title: 'Sentirse cansado(a) o con poca energía', helper: PERIOD },
  { id: 5, title: 'Tener poco apetito o comer en exceso', helper: PERIOD },
  {
    id: 6,
    title: 'Sentirse mal con usted mismo(a), o que es un fracaso o que ha quedado mal con usted o con su familia',
    helper: PERIOD,
  },
  {
    id: 7,
    title: 'Tener dificultad para concentrarse en cosas como leer el periódico o ver televisión',
    helper: PERIOD,
  },
  {
    id: 8,
    title:
      'Moverse o hablar tan lento que otra gente podría haberlo notado, o lo contrario: estar tan inquieto(a) que se ha movido mucho más de lo habitual',
    helper: PERIOD,
  },
  {
    id: PHQ9_ITEM9_ID,
    title: 'Pensamientos de que estaría mejor muerto(a) o de lastimarse de alguna manera',
    helper: PERIOD,
  },
];

export const phq9Options: ScaleOption[] = [
  { label: 'Nunca', value: 0 },
  { label: 'Varios días', value: 1 },
  { label: 'Más de la mitad de los días', value: 2 },
  { label: 'Casi todos los días', value: 3 },
];

interface Phq9Range {
  min: number;
  max: number;
  category: string;
  categoryLabel: string;
}

const PHQ9_RANGES: Phq9Range[] = [
  { min: 0, max: 4, category: 'minimo', categoryLabel: 'Depresión mínima' },
  { min: 5, max: 9, category: 'leve', categoryLabel: 'Depresión leve' },
  { min: 10, max: 14, category: 'moderado', categoryLabel: 'Depresión moderada' },
  { min: 15, max: 19, category: 'moderadamente_severo', categoryLabel: 'Depresión moderadamente severa' },
  { min: 20, max: 27, category: 'severo', categoryLabel: 'Depresión severa' },
];

export function phq9Score(answers: Record<number, number>): TestResult {
  const raw = phq9Questions.reduce((total, question) => total + (answers[question.id] ?? 0), 0);
  const range = PHQ9_RANGES.find((item) => raw >= item.min && raw <= item.max) ?? PHQ9_RANGES[0];

  return {
    score: raw,
    maxScore: 27,
    category: range.category,
    categoryLabel: range.categoryLabel,
  };
}

export const phq9: Instrument = {
  id: 'phq9',
  name: 'PHQ-9 · Ánimo',
  eyebrow: 'TEST DE ÁNIMO (PHQ-9)',
  questions: phq9Questions,
  options: phq9Options,
  interpretation: {
    minimo: 'No se registran síntomas depresivos significativos en las últimas dos semanas.',
    leve: 'Síntomas depresivos leves. Vale la pena seguir observándote y cuidar tu rutina de descanso.',
    moderado: 'Síntomas depresivos moderados. Conversemos con el área de bienestar para revisar cómo apoyarte.',
    moderadamente_severo:
      'Síntomas depresivos moderadamente severos. Buscar acompañamiento profesional es una buena decisión.',
    severo: 'Síntomas depresivos severos. Te recomendamos contactar al área de bienestar estudiantil cuanto antes.',
  },
  score: phq9Score,
};
