import type { BreathMoment } from '../domain/breathing478.ts';
import { soundForMoment, type BreathSoundId } from '../domain/breathingSounds.ts';

/** Lo que el controlador necesita de un reproductor; la infraestructura lo implementa con audio real. */
export interface BreathSoundPlayer {
  preload(): Promise<void>;
  play(id: BreathSoundId): void;
  /** Silencia todo con una salida gradual de 200 ms como máximo. */
  stopAll(): void;
  release(): void;
}

export interface BreathSoundController {
  /** Empieza una sesión: silencia lo anterior y deja el controlador listo para sonar. */
  begin(): void;
  /**
   * Se llama con el momento calculado; solo suena cuando cambia la fase o el ciclo. Un momento nulo significa
   * que la sesión terminó o se detuvo: no suena nada, no se corta lo que esté sonando (la última exhalación
   * termina sola) y el controlador queda quieto hasta el siguiente `begin()`.
   */
  update(moment: BreathMoment | null): void;
  /** Silencia ahora y olvida el momento atendido; la sesión puede seguir sonando en la siguiente fase. */
  stop(): void;
  /** Silencia y libera el reproductor. */
  dispose(): void;
}

/**
 * Une la lógica de `soundForMoment` con un reproductor. Un fallo del audio nunca debe romper la
 * sesión: se descarta sin mensaje ni registro.
 */
export function createBreathSoundController(
  player: BreathSoundPlayer,
  isEnabled: () => boolean,
): BreathSoundController {
  let started = false;
  let previous: BreathMoment | null = null;

  function safely(action: () => void): void {
    try {
      action();
    } catch {
      // Sin audio la sesión visual sigue igual; no se muestra ni se registra nada.
    }
  }

  return {
    begin() {
      safely(() => player.stopAll());
      started = true;
      previous = null;
    },

    update(moment) {
      if (!started) return;

      if (moment === null) {
        started = false;
        previous = null;
        return;
      }

      const sound = soundForMoment({ previous, current: moment });
      // Con el sonido apagado igual avanzamos el momento: al encenderlo no suena lo que ya pasó.
      if (sound !== null && isEnabled()) safely(() => player.play(sound));
      previous = moment;
    },

    stop() {
      safely(() => player.stopAll());
      previous = null;
    },

    dispose() {
      started = false;
      previous = null;
      safely(() => player.stopAll());
      safely(() => player.release());
    },
  };
}
