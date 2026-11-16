import { platformSecureKeyValueStorage as storage } from '@/shared/backend/infrastructure/platformSecureStorage';

/* Recuerda en este teléfono si ya se vio la guía de cada herramienta (p. ej. 'pomodoro'). */
const keyFor = (tool: string) => `duocmind.${tool}.guideSeen.v1`;

/** ¿Ya vio la guía? Ante un error decimos que sí, para no molestar. */
export async function hasSeenGuide(tool: string): Promise<boolean> {
  try {
    return (await storage.getItem(keyFor(tool))) === '1';
  } catch {
    return true;
  }
}

export async function markGuideSeen(tool: string): Promise<void> {
  try {
    await storage.setItem(keyFor(tool), '1');
  } catch {
    // Sin guardar, la guía volverá a aparecer la próxima vez; no es grave.
  }
}
