import type { CheckinMood } from '../application/localCheckinStore';

/** Escala del slider: posición 0 = 'Muy mal' … 4 = 'Muy bien'. */
export const MOOD_SCALE: CheckinMood[] = ['Muy mal', 'Mal', 'Neutro', 'Bien', 'Muy bien'];
export const MOOD_MAX = MOOD_SCALE.length - 1;

export function clampMoodValue(value: number): number {
  return Math.min(MOOD_MAX, Math.max(0, value));
}

/** Estado más cercano a una posición continua del slider. */
export function moodFromValue(value: number): CheckinMood {
  return MOOD_SCALE[Math.round(clampMoodValue(value))];
}

export function valueFromMood(mood: CheckinMood): number {
  return MOOD_SCALE.indexOf(mood);
}
