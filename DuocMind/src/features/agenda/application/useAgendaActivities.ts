import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { AgendaActivity } from '../domain/agendaActivity';
import type { AgendaActivitiesGateway } from './agendaItems';
export const AgendaActivitiesContext = createContext<AgendaActivitiesGateway | null>(null);
export function useAgendaActivities() {
  const gateway = useContext(AgendaActivitiesContext);
  if (!gateway) throw new Error('No se pudo iniciar tu agenda.');
  const [activities, setActivities] = useState<AgendaActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const active = useRef(false), request = useRef(0);
  const refresh = useCallback(async () => {
    const sequence = ++request.current;
    try {
      const result = await gateway.load();
      if (active.current && sequence === request.current) { setActivities(result); setError(null); }
    } catch (e) {
      if (active.current && sequence === request.current) setError(e instanceof Error ? e.message : 'No se pudo leer tu agenda.');
    } finally { if (active.current && sequence === request.current) setLoading(false); }
  }, [gateway]);
  useFocusEffect(useCallback(() => {
    active.current = true; void refresh();
    return () => { active.current = false; request.current += 1; };
  }, [refresh]));
  return { activities, loading, error,
    async save(activity: AgendaActivity) {
      await gateway.save(activity); request.current += 1;
      if (active.current) { setLoading(false); setActivities(previous => [...previous.filter(item=>item.id!==activity.id), activity]); await refresh(); }
    },
    async remove(id: string) {
      await gateway.remove(id); request.current += 1;
      if (active.current) { setLoading(false); setActivities(previous => previous.filter(activity => activity.id !== id)); await refresh(); }
    },
  };
}
