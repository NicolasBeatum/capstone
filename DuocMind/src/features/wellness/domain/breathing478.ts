/* Respiración 4-7-8: inhalar 4 s, aguantar 7 s, exhalar 8 s. Fija, no se edita. */

export type BreathKind = 'inhale' | 'hold' | 'exhale';

export interface BreathPhase {
  kind: BreathKind;
  label: string;
  seconds: number;
}

export const BREATH_PHASES: readonly BreathPhase[] = [
  { kind: 'inhale', label: 'Inhala', seconds: 4 },
  { kind: 'hold', label: 'Aguanta', seconds: 7 },
  { kind: 'exhale', label: 'Exhala', seconds: 8 },
];

/** Se recomiendan 4 ciclos para partir. */
export const BREATH_CYCLES = 4;

const CYCLE_SECONDS = BREATH_PHASES.reduce((sum, phase) => sum + phase.seconds, 0); // 19 s

export interface BreathMoment {
  phase: BreathPhase;
  /** Ciclo actual, desde 1. */
  cycle: number;
  /** Avance dentro de la fase, de 0 a 1. */
  progress: number;
}

/** Dónde vamos según los segundos transcurridos; null si la sesión ya terminó. */
export function breathMomentAt(elapsedSeconds: number): BreathMoment | null {
  if (elapsedSeconds < 0) elapsedSeconds = 0;
  const cycleIndex = Math.floor(elapsedSeconds / CYCLE_SECONDS);
  if (cycleIndex >= BREATH_CYCLES) return null;

  let secondsInCycle = elapsedSeconds - cycleIndex * CYCLE_SECONDS;
  for (const phase of BREATH_PHASES) {
    if (secondsInCycle < phase.seconds) {
      return { phase, cycle: cycleIndex + 1, progress: secondsInCycle / phase.seconds };
    }
    secondsInCycle -= phase.seconds;
  }
  return null; // no debería pasar
}

/** Tamaño del círculo (0.6 a 1): crece al inhalar, se queda al aguantar y se achica al exhalar. */
export function circleScale(moment: BreathMoment): number {
  const SMALL = 0.6;
  const BIG = 1;
  if (moment.phase.kind === 'inhale') return SMALL + (BIG - SMALL) * moment.progress;
  if (moment.phase.kind === 'hold') return BIG;
  return BIG - (BIG - SMALL) * moment.progress;
}
