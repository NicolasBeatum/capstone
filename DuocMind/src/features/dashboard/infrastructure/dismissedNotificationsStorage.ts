import { platformSecureKeyValueStorage } from '@/shared/backend/infrastructure/platformSecureStorage';

const STORAGE_KEY = 'duocmind.notifications.dismissed.v1';
/* Las ids incluyen la fecha del evento, así que las antiguas dejan de importar */
const MAX_STORED_IDS = 50;

export async function getDismissedNotificationIds(): Promise<string[]> {
  try {
    const raw = await platformSecureKeyValueStorage.getItem(STORAGE_KEY);
    const ids: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export async function dismissNotification(id: string): Promise<void> {
  const ids = await getDismissedNotificationIds();
  if (ids.includes(id)) return;
  const next = [...ids, id].slice(-MAX_STORED_IDS);
  await platformSecureKeyValueStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
