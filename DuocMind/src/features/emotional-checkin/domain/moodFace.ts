import type { CheckinMood } from '../application/localCheckinStore';

/* Escala continua del ánimo: 0 = 'Muy mal' ... 4 = 'Muy bien'. */
export const MOOD_SCALE: readonly CheckinMood[] = ['Muy mal', 'Mal', 'Neutro', 'Bien', 'Muy bien'];
export const MOOD_MIN = 0;
export const MOOD_MAX = MOOD_SCALE.length - 1;

/* Colores del rostro en cada punto entero de la escala: terracota → arena → amarillo */
const FACE_COLORS = ['#e8a28a', '#f0b78f', '#f4dca8', '#f8dc78', '#f6c94c'] as const;

export function clampMood(value: number): number {
  return Math.min(MOOD_MAX, Math.max(MOOD_MIN, value));
}

/* Estado discreto que se guarda: el punto entero más cercano de la escala */
export function moodFromValue(value: number): CheckinMood {
  return MOOD_SCALE[Math.round(clampMood(value))];
}

export interface FaceShape {
  fill: string;
  /* Trazos SVG en un lienzo de 100 × 100 */
  mouth: string;
  leftBrow: string;
  rightBrow: string;
  /* Radio vertical de los ojos: se entrecierran al estar muy bien */
  eyeRadiusY: number;
  /* 0..1: rubor en las mejillas cuando el ánimo es alto */
  blush: number;
  /* 0..1: lágrima cuando el ánimo es muy bajo */
  tear: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function faceColor(value: number): string {
  const position = clampMood(value);
  const lower = Math.min(Math.floor(position), MOOD_MAX - 1);
  const ratio = position - lower;
  const from = hexToRgb(FACE_COLORS[lower]);
  const to = hexToRgb(FACE_COLORS[lower + 1]);
  const channel = (index: number) => Math.round(from[index] + (to[index] - from[index]) * ratio);
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
}

const n = (value: number) => value.toFixed(2);

/* Calcula el rostro para cualquier valor intermedio, de modo que la expresión
 * cambie de forma continua mientras la persona desliza. */
export function describeFace(value: number): FaceShape {
  const position = clampMood(value);
  const k = (position - 2) / 2; // -1 (muy mal) ... 1 (muy bien)
  const happy = Math.max(0, k);
  const sad = Math.max(0, -k);

  const halfWidth = 16 + 6 * Math.abs(k);
  const endY = 66 - 4 * k;
  const controlY = 66 + 24 * k;
  const mouth = `M ${n(50 - halfWidth)} ${n(endY)} Q 50 ${n(controlY)} ${n(50 + halfWidth)} ${n(endY)}`;

  const browY = 33 - happy * 2.5;
  const tilt = sad * 6;
  const leftBrow = `M 26 ${n(browY + tilt)} L 43 ${n(browY - tilt)}`;
  const rightBrow = `M 57 ${n(browY - tilt)} L 74 ${n(browY + tilt)}`;

  return {
    fill: faceColor(position),
    mouth,
    leftBrow,
    rightBrow,
    eyeRadiusY: 5 * (1 - Math.max(0, k - 0.4) * 0.9),
    blush: Math.min(1, Math.max(0, k - 0.3) / 0.7),
    tear: Math.min(1, Math.max(0, sad - 0.4) / 0.6),
  };
}
