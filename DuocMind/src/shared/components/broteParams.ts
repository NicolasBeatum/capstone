/**
 * Parámetros del Brote calculados a partir de una sola posición continua t (0 a 1).
 * Función pura, sin React: cada valor se interpola linealmente entre los cinco
 * estados (Muy mal 0, Mal 0.25, Normal 0.5, Bien 0.75, Muy bien 1).
 *
 * El Brote nunca se marchita ni expresa tristeza propia: con ánimo bajo descansa
 * (verde, erguido y sereno) y solo cambia de color hacia el púrpura.
 */

const STATE_TIMES = [0, 0.25, 0.5, 0.75, 1];

const STEM_HEIGHT = [34, 50, 66, 78, 88];
/** Grados; Muy mal pliega las hojas hacia arriba (como al dormir) y Mal las abre en horizontal. */
const LEAF_ANGLE = [-58, 2, -25, -35, -35];
/** Todas las bocas sonríen; Normal sonríe suave para no verse serio. */
const MOUTH_CURVE = [6, 6, 5, 8, 14];

/** El macetero siempre es amarillo; con ánimo bajo se le suma un poco de sombra. */
const POT_COLOR = '#F6D57E';
const POT_SHADOW = '#7A6A4A';
const POT_SHADOW_AMOUNT = 0.22;

/**
 * Paleta única del estado de ánimo, de púrpura (Muy mal) a verde (Muy bien). La usan el
 * macetero, la barra del check-in y el gráfico semanal para que los tres coincidan.
 */
export const MOOD_PALETTE = {
  'Muy mal': '#8b80b1',
  'Mal': '#a99fcf',
  'Neutro': '#cfc8b9',
  'Bien': '#9fcaa8',
  'Muy bien': '#5bb07f',
};
const POT_COLORS = [
  MOOD_PALETTE['Muy mal'],
  MOOD_PALETTE.Mal,
  MOOD_PALETTE.Neutro,
  MOOD_PALETTE.Bien,
  MOOD_PALETTE['Muy bien'],
];

export const BROTE_COLORS = {
  ink: '#1A2638',
  leaf: '#8CC48A',
  stem: '#4E8A5A',
  petal: '#F7A8A0',
  flowerCenter: '#F2C14E',
  blush: '#F4A39A',
  sparkle: '#E8A83A',
  moon: '#FBEFC0',
  cloud: '#FFFFFF',
};

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Posición t válida: limitada a 0-1 y, si no es número, en el punto medio (Normal). Evita dibujos con NaN. */
export function safeT(value: number): number {
  return Number.isNaN(value) ? 0.5 : clamp01(value);
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

/** Color del macetero: amarillo fijo, algo más sombreado en Muy mal y Mal. */
export function potColorAt(t: number): string {
  const shade = 1 - smoothstep(0.25, 0.5, t);
  return mixColors(POT_COLOR, POT_SHADOW, shade * POT_SHADOW_AMOUNT);
}

/** Color de la barra del check-in (púrpura a verde) para una posición t. */
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
  /** Grados; negativo = hoja levantada, positivo = hoja caída (ningún estado la deja caída). */
  leafAngle: number;
  leafLength: number;
  /** Punto del tallo (0 base, 1 punta) donde nacen las hojas. */
  leafAttach: number;
  potColor: string;
  /** Capullo en la punta: verde hasta Normal y rosado al abrirse en flor. */
  budLength: number;
  budColor: string;
  /** Apertura de la flor: pétalos escalan de 0 a 1 entre t=0.75 y t=1. */
  flower: number;
  /** Destellos: solo en Muy bien. */
  sparkle: number;
  /**
   * Círculo detrás del Brote: púrpura en Muy mal y Mal (con luna o nubes), verde en Bien y
   * Muy bien, y ausente en Normal.
   */
  scene: {
    circle: number;
    moon: number;
    cloud: number;
    tint: string;
  };
  face: {
    mouthCurve: number;
    mouthHalfWidth: number;
    /** Cierre inferior de la boca: 1 = línea, menor = boca abierta. */
    mouthLowerCurve: number;
    mouthOpen: number;
    dotEyes: number;
    /** Ojos en arco, alegres: solo en Muy bien. Los demás estados tienen los ojos abiertos. */
    happyEyes: number;
    blush: number;
  };
}

export function broteParams(rawT: number): BroteParams {
  const t = safeT(rawT);
  const flower = clamp01((t - 0.75) / 0.25);
  const budGrowth = smoothstep(0.25, 0.75, t);
  const happyEyes = clamp01((t - 0.82) / 0.06);

  return {
    stemHeight: sampleStates(STEM_HEIGHT, t),
    leafAngle: sampleStates(LEAF_ANGLE, t),
    leafLength: lerp(26, 34, t),
    leafAttach: lerp(0.7, 0.5, smoothstep(0, 0.5, t)),
    potColor: potColorAt(t),
    budLength: lerp(14, 22, budGrowth),
    budColor: mixColors(BROTE_COLORS.leaf, BROTE_COLORS.petal, smoothstep(0.5, 0.75, t)),
    flower,
    sparkle: flower,
    scene: {
      circle: smoothstep(0, 0.25, Math.abs(t - 0.5)),
      moon: clamp01(1 - t / 0.25),
      cloud: clamp01(1 - Math.abs(t - 0.25) / 0.25),
      tint: mixColors(moodColorAt(t), '#ffffff', 0.6),
    },
    face: {
      mouthCurve: sampleStates(MOUTH_CURVE, t),
      mouthHalfWidth: lerp(9, 15, t),
      mouthLowerCurve: lerp(1, 0.25, clamp01((t - 0.7) / 0.3)),
      mouthOpen: clamp01((t - 0.75) / 0.15),
      dotEyes: 1 - happyEyes,
      happyEyes,
      // Un rubor leve en Normal para que la cara se vea cálida.
      blush: Math.max(0.4, clamp01((0.4 - t) / 0.15), clamp01((t - 0.5) / 0.25)),
    },
  };
}
