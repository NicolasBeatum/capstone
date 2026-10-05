import type { AgendaActivity } from '../domain/agendaActivity';

const STORAGE_KEY = 'duocmind.agenda.activities.v1';

function isAgendaActivity(value: unknown): value is AgendaActivity {
  if (typeof value !== 'object' || value === null) return false;
  return (
    'id' in value &&
    typeof value.id === 'string' &&
    'date' in value &&
    typeof value.date === 'string' &&
    'title' in value &&
    typeof value.title === 'string' &&
    'subject' in value &&
    typeof value.subject === 'string' &&
    'time' in value &&
    typeof value.time === 'string'
  );
}

function getStorage(): Storage {
  if (typeof window === 'undefined') {
    throw new Error('El almacenamiento de la agenda no está disponible.');
  }
  return window.localStorage;
}

export async function getAgendaActivities(): Promise<AgendaActivity[]> {
  const rawActivities = getStorage().getItem(STORAGE_KEY);
  if (!rawActivities) return [];

  const activities: unknown = JSON.parse(rawActivities);
  if (!Array.isArray(activities) || !activities.every(isAgendaActivity)) {
    throw new Error('No se pudieron leer las actividades guardadas.');
  }
  return activities;
}

export async function saveAgendaActivity(activity: AgendaActivity): Promise<void> {
  const activities = await getAgendaActivities();
  getStorage().setItem(STORAGE_KEY, JSON.stringify([...activities, activity]));
}

export async function deleteAgendaActivity(id: string): Promise<void> {
  const activities = await getAgendaActivities();
  getStorage().setItem(STORAGE_KEY, JSON.stringify(activities.filter((activity) => activity.id !== id)));
}
