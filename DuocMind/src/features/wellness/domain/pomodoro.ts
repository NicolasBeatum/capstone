/* Lógica simple del temporizador Pomodoro. No depende de React ni de la base de datos. */

export interface PomodoroConfig {
  studyMinutes: number;
  breakMinutes: number;
  blocks: number;
}

/** Lo que guardamos en el teléfono al terminar (o detener) una sesión. */
export interface PomodoroSession {
  config: PomodoroConfig;
  completedBlocks: number;
  studiedMinutes: number;
  finishedAt: string;
}

export interface PomodoroPhase {
  kind: 'study' | 'break';
  minutes: number;
}

export const DEFAULT_CONFIG: PomodoroConfig = { studyMinutes: 30, breakMinutes: 20, blocks: 2 };

/** Límites de cada ajuste: [mínimo, máximo, paso]. */
export const LIMITS = {
  studyMinutes: [5, 90, 5],
  breakMinutes: [5, 30, 5],
  blocks: [1, 8, 1],
} as const;

export function clampSetting(key: keyof PomodoroConfig, value: number): number {
  const [min, max] = LIMITS[key];
  return Math.min(max, Math.max(min, value));
}

/** Bloque de estudio, descanso, bloque de estudio… sin descanso al final. */
export function buildPhases(config: PomodoroConfig): PomodoroPhase[] {
  const phases: PomodoroPhase[] = [];
  for (let i = 0; i < config.blocks; i++) {
    phases.push({ kind: 'study', minutes: config.studyMinutes });
    if (i < config.blocks - 1) phases.push({ kind: 'break', minutes: config.breakMinutes });
  }
  return phases;
}

/** 1500 → "25:00" */
export function formatTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.ceil(totalSeconds));
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/** Texto que resume la última sesión y anima a subir un poco la meta. */
export function lastSessionMessage(session: PomodoroSession | null): string {
  if (!session) return 'Aún no tienes sesiones. ¡Parte con la configuración estándar!';
  const blocks = session.completedBlocks === 1 ? '1 bloque' : `${session.completedBlocks} bloques`;
  return `Última sesión: ${blocks}, ${session.studiedMinutes} min de estudio. ¿Te atreves a sumar 5 minutos o un bloque más?`;
}

/** Lee la sesión guardada; si el texto está dañado o incompleto devuelve null. */
export function parseSession(raw: string | null): PomodoroSession | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as PomodoroSession;
    const { studyMinutes, breakMinutes, blocks } = data.config;
    if ([studyMinutes, breakMinutes, blocks, data.completedBlocks, data.studiedMinutes].some((n) => typeof n !== 'number')) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}
