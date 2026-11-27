import type { BreathSoundPlayer } from '../application/breathingSoundController.ts';
import type { BreathSoundId } from '../domain/breathingSounds.ts';

/*
 * Lógica del reproductor de la respiración (spec 024), separada de `expo-audio` para poder probarla con
 * `node --test`: recibe lo que necesita del audio por parámetro. `breathSoundPlayer.ts` la conecta con la librería real.
 */

/** Lo que se usa de un `AudioPlayer` de expo-audio. */
export interface AudioPlayerLike {
  volume: number;
  play(): void;
  pause(): void;
  seekTo(seconds: number): Promise<void>;
  remove(): void;
}

export interface BreathSoundPlayerDeps {
  /** Crea el reproductor de un archivo (una sola vez por sonido). */
  createPlayer(source: number): AudioPlayerLike;
  /** Configura el modo de audio de la aplicación; se llama una sola vez. */
  configureAudio(): Promise<void>;
  /** Recurso de cada sonido, resuelto con `require` estático para que Metro lo empaquete. */
  sources: Record<BreathSoundId, number>;
}

/** Salida gradual al silenciar: 5 pasos de 30 ms = 150 ms, dentro del límite de 200 ms de RF-006. */
export const FADE_STEPS = 5;
export const FADE_STEP_MS = 30;

export function createBreathSoundPlayerWith(deps: BreathSoundPlayerDeps): BreathSoundPlayer {
  const soundIds = Object.keys(deps.sources) as BreathSoundId[];
  const players = new Map<BreathSoundId, AudioPlayerLike>();
  /** Reproductores que han sonado desde la última vez que se silenció todo. */
  const sounded = new Set<AudioPlayerLike>();
  let fadeTimer: ReturnType<typeof setInterval> | null = null;
  let audioMode: Promise<void> | null = null;

  /*
   * Modo de audio, una sola vez: se mezcla con la música de otras apps, no suena con el teléfono en silencio ni en
   * segundo plano y no usa el micrófono. Un fallo se descarta: la sesión visual sigue igual (RF-007).
   */
  function ensureAudioMode(): Promise<void> {
    audioMode ??= Promise.resolve()
      .then(() => deps.configureAudio())
      .catch(() => undefined);
    return audioMode;
  }

  function playerFor(id: BreathSoundId): AudioPlayerLike {
    let player = players.get(id);
    if (!player) {
      player = deps.createPlayer(deps.sources[id]);
      players.set(id, player);
    }
    return player;
  }

  /**
   * Vuelve a 0 s. La orden se da de inmediato (antes del `play()` que sigue), pero no se espera su resultado ni se
   * deja un rechazo sin atender: un fallo, incluso síncrono, se descarta.
   */
  function rewind(player: AudioPlayerLike): void {
    try {
      void Promise.resolve(player.seekTo(0)).catch(() => undefined);
    } catch {
      // sin poder rebobinar, el sonido igual se intenta reproducir
    }
  }

  function clearFade(): void {
    if (fadeTimer !== null) {
      clearInterval(fadeTimer);
      fadeTimer = null;
    }
  }

  /** Termina de golpe lo que sonó: pausa, vuelve a 0 s y restablece el volumen. Cancela una salida gradual en curso. */
  function settle(): void {
    clearFade();
    for (const player of sounded) {
      try {
        player.pause();
        player.volume = 1;
        rewind(player);
      } catch {
        // Un reproductor que falla no debe impedir silenciar a los demás.
      }
    }
    sounded.clear();
  }

  return {
    async preload() {
      await ensureAudioMode();
      for (const id of soundIds) playerFor(id);
    },

    play(id) {
      // Una salida gradual en curso se cierra; los sonidos que suenan a la vez no se tocan (el eco de una fase
      // sigue sonando cuando empieza la siguiente).
      if (fadeTimer !== null) settle();
      void ensureAudioMode();
      const player = playerFor(id);
      player.volume = 1;
      rewind(player);
      player.play();
      sounded.add(player);
    },

    stopAll() {
      // Si ya hay una salida en curso se deja seguir: reiniciarla subiría el volumen a mitad del fundido.
      if (fadeTimer !== null || sounded.size === 0) return;
      let step = 0;
      fadeTimer = setInterval(() => {
        step += 1;
        for (const player of sounded) {
          try {
            player.volume = Math.max(0, 1 - step / FADE_STEPS);
          } catch {
            // se ignora: el paso final pausa de todos modos
          }
        }
        if (step >= FADE_STEPS) settle();
      }, FADE_STEP_MS);
    },

    release() {
      settle();
      for (const player of players.values()) {
        try {
          player.remove();
        } catch {
          // ya liberado
        }
      }
      players.clear();
    },
  };
}
