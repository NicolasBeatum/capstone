import type { CheckinMood } from '../application/localCheckinStore';

/** Escala del slider: posición 0 = 'Muy mal' … 4 = 'Muy bien'. */
export const MOOD_SCALE: CheckinMood[] = ['Muy mal', 'Mal', 'Neutro', 'Bien', 'Muy bien'];
export const MOOD_MAX = MOOD_SCALE.length - 1;

/* Tonos de la cara por estado, de terracota apagado a amarillo cálido */
const FACE_COLORS = ['#e7a487', '#efbf94', '#f3d9a4', '#f6d36d', '#f4c13d'];

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

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Color de la cara interpolado entre los estados vecinos, para que cambie suave al arrastrar. */
export function faceColorForValue(value: number): string {
  const v = clampMoodValue(value);
  const lower = Math.floor(v);
  const upper = Math.min(MOOD_MAX, lower + 1);
  const t = v - lower;
  const from = hexToRgb(FACE_COLORS[lower]);
  const to = hexToRgb(FACE_COLORS[upper]);
  const mixed = from.map((channel, i) => Math.round(channel + (to[i] - channel) * t));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}
