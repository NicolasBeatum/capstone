import { platformSecureKeyValueStorage as storage } from '@/shared/backend/infrastructure/platformSecureStorage';
import { parseSession, type PomodoroSession } from '../domain/pomodoro';

/* Solo vive en este teléfono: no se envía a la base de datos. */
const KEY = 'duocmind.pomodoro.lastSession.v1';

export async function loadLastSession(): Promise<PomodoroSession | null> {
  try {
    return parseSession(await storage.getItem(KEY));
  } catch {
    return null;
  }
}

export async function saveLastSession(session: PomodoroSession): Promise<void> {
  try {
    await storage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Si no se puede guardar, el temporizador sigue funcionando igual.
  }
}
