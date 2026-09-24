import { PHQ9_ITEM9_ID } from './data/phq9';
import type { TestResult } from './data/types';

/** PHQ-2 >= 3 sugiere aplicar el PHQ-9 completo */
export const PHQ2_CUTOFF = 3;
/** GAD-2 >= 2 sugiere aplicar el GAD-7 completo */
export const GAD2_CUTOFF = 2;

/** Estados de ánimo del check-in simple que activan el sondeo inicial */
const SONDEO_TRIGGER_MOODS = ['mal', 'muy_mal', 'muy mal'];

/** Categorías de PHQ-9/GAD-7 que ameritan derivación al área de bienestar */
const REFERRAL_CATEGORIES = ['moderado', 'moderadamente_severo', 'severo'];

export function shouldOfferSondeo(mood: string): boolean {
  return SONDEO_TRIGGER_MOODS.includes(mood.trim().toLowerCase());
}

export function shouldOfferPhq9(depressionScore: number): boolean {
  return depressionScore >= PHQ2_CUTOFF;
}

export function shouldOfferGad7(anxietyScore: number): boolean {
  return anxietyScore >= GAD2_CUTOFF;
}

/**
 * Ítem 9 del PHQ-9 (ideación de autolesión): cualquier respuesta > 0
 * interrumpe el flujo normal y exige navegación a recursos de crisis.
 */
export function isPhq9Item9Positive(questionId: number, value: number): boolean {
  return questionId === PHQ9_ITEM9_ID && value > 0;
}

export function needsModerateReferral(result: TestResult): boolean {
  return REFERRAL_CATEGORIES.includes(result.category);
}
