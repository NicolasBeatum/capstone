/**
 * Parámetros del Brote calculados a partir de una sola posición continua t (0 a 1).
 * Función pura, sin React: cada valor se interpola linealmente entre los cinco
 * estados (Muy mal 0, Mal 0.25, Normal 0.5, Bien 0.75, Muy bien 1).
 */

const STATE_TIMES = [0, 0.25, 0.5, 0.75, 1];

const STEM_HEIGHT = [36, 52, 66, 78, 88];
const STEM_CURVE = [42, 16, 0, 0, 0];
const LEAF_ANGLE = [40, 15, -25, -35, -35];
const POT_COLORS = ['#C9BBE6', '#C8D7EE', '#E8DFCC', '#F6D57E', '#F2B45C'];
const MOUTH_CURVE = [-10, -5, 0, 8, 14];

export const BROTE_COLORS = {
  ink: '#1A2638',
  leaf: '#8CC48A',
  stem: '#4E8A5A',
  dryLeaf: '#C4B27A',
  petal: '#F7A8A0',
  flowerCenter: '#F2C14E',
  tear: '#7FB3E6',
  blush: '#F4A39A',
  sparkle: '#E8A83A',
};

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

/** Transición suave entre dos tiempos: 0 antes de `from`, 1 después de `to`. */
export function smoothstep(from: number, to: number, value: number): number {
  const x = clamp01((value - from) / (to - from));
  return x * x * (3 - 2 * x);
}

/** Valor interpolado entre los cinco estados. */
function sampleStates(values: number[], t: number): number {
  const clamped = clamp01(t);
  for (let i = 1; i < STATE_TIMES.length; i += 1) {
    if (clamped <= STATE_TIMES[i]) {
      const span = STATE_TIMES[i] - STATE_TIMES[i - 1];
      return lerp(values[i - 1], values[i], (clamped - STATE_TIMES[i - 1]) / span);
    }
  }
  return values[values.length - 1];
}

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mezcla dos colores hex (#rrggbb). */
export function mixColors(from: string, to: string, amount: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const mixed = a.map((channel, i) => Math.round(lerp(channel, b[i], clamp01(amount))));
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

/** Color del macetero (y de la barra) para una posición t. */
export function moodColorAt(t: number): string {
  const clamped = clamp01(t);
  for (let i = 1; i < STATE_TIMES.length; i += 1) {
    if (clamped <= STATE_TIMES[i]) {
      const span = STATE_TIMES[i] - STATE_TIMES[i - 1];
      return mixColors(POT_COLORS[i - 1], POT_COLORS[i], (clamped - STATE_TIMES[i - 1]) / span);
    }
  }
  return POT_COLORS[POT_COLORS.length - 1];
}

export interface BroteParams {
  stemHeight: number;
  stemCurve: number;
  /** Grados; positivo = hoja caída, negativo = hoja levantada. */
  leafAngle: number;
  leafLength: number;
  /** Punto del tallo (0 base, 1 punta) donde nacen las hojas. */
  leafAttach: number;
  potColor: string;
  /** Hoja seca en la punta: 1 en Muy mal y Mal, se desvanece hacia Normal. */
  dryLeaf: number;
  /** Brote o capullo: aparece hacia Normal y se abre en flor. */
  bud: number;
  budLength: number;
  budColor: string;
  /** Apertura de la flor: pétalos escalan de 0 a 1 entre t=0.75 y t=1. */
  flower: number;
  /** Destellos: solo en Muy bien. */
  sparkle: number;
  face: {
    mouthCurve: number;
    mouthHalfWidth: number;
    /** Cierre inferior de la boca: 1 = línea, menor = boca abierta. */
    mouthLowerCurve: number;
    mouthOpen: number;
    sadEyes: number;
    dotEyes: number;
    happyEyes: number;
    brows: number;
    blush: number;
    tear: number;
  };
}

export function broteParams(rawT: number): BroteParams {
  const t = clamp01(rawT);
  const flower = clamp01((t - 0.75) / 0.25);
  const budGrowth = smoothstep(0.25, 0.75, t);
  const sadEyes = clamp01((0.18 - t) / 0.06);
  const happyEyes = clamp01((t - 0.82) / 0.06);

  return {
    stemHeight: sampleStates(STEM_HEIGHT, t),
    stemCurve: sampleStates(STEM_CURVE, t),
    leafAngle: sampleStates(LEAF_ANGLE, t),
    leafLength: lerp(26, 34, t),
    leafAttach: lerp(0.85, 0.5, smoothstep(0, 0.5, t)),
    potColor: moodColorAt(t),
    dryLeaf: 1 - smoothstep(0.25, 0.5, t),
    bud: smoothstep(0.25, 0.5, t),
    budLength: lerp(14, 22, budGrowth),
    budColor: mixColors(BROTE_COLORS.leaf, BROTE_COLORS.petal, smoothstep(0.5, 0.75, t)),
    flower,
    sparkle: flower,
    face: {
      mouthCurve: sampleStates(MOUTH_CURVE, t),
      mouthHalfWidth: lerp(9, 15, t),
      mouthLowerCurve: lerp(1, 0.25, clamp01((t - 0.7) / 0.3)),
      mouthOpen: clamp01((t - 0.75) / 0.15),
      sadEyes,
      dotEyes: 1 - Math.max(sadEyes, happyEyes),
      happyEyes,
      brows: clamp01(1 - Math.abs(t - 0.25) / 0.12),
      blush: clamp01((t - 0.5) / 0.25),
      tear: clamp01(1 - t / 0.2),
    },
  };
}
