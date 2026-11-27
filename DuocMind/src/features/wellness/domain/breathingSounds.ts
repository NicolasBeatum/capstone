import type { BreathMoment } from './breathing478.ts';

/*
 * Qué sonido corresponde a cada cambio de la respiración 4-7-8. Lógica pura: no sabe de audio ni de React.
 * Hay un sonido por fase; el soplo y los latidos de cada segundo ya vienen dentro del archivo (spec 024, v0.2.0),
 * así que no hay sonidos de inicio, de cambio de ciclo ni de final.
 */

export type BreathSoundId = 'inhale' | 'hold' | 'exhale';

/** Si el cambio se detecta más tarde que esto desde el inicio de la fase, ya no suena (evita sonidos a mitad de fase). */
export const LATE_CUE_TOLERANCE_SECONDS = 0.5;

export interface BreathCueInput {
  /** Momento ya atendido; null si aún no hay ninguno. */
  previous: BreathMoment | null;
  /** Momento actual; null si no corre o terminó. */
  current: BreathMoment | null;
}

/** El sonido que debe empezar ahora, o null si no cambió nada, si ya es tarde o si no hay sesión. */
export function soundForMoment({ previous, current }: BreathCueInput): BreathSoundId | null {
  if (current === null) return null;

  const samePhase =
    previous !== null && previous.cycle === current.cycle && previous.phase.kind === current.phase.kind;
  if (samePhase) return null;

  const secondsIntoPhase = current.progress * current.phase.seconds;
  if (secondsIntoPhase > LATE_CUE_TOLERANCE_SECONDS) return null;

  return current.phase.kind;
}
