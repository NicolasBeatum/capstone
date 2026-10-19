import { useCallback, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabaseAuthGateway } from '@/features/auth/infrastructure/supabaseAuthGateway';
import { loadCheckinHistory } from '../application/checkinHistory';
import { currentWeekRange, summarizeWeek, type WeekMoodDay } from '../domain/weekMood';
import { getLocalCheckinStore } from '../infrastructure/encryptedCheckinDatabase';
import { supabaseCheckinGateway } from '../infrastructure/supabaseCheckinGateway';
import { supabaseCheckinChangeFeed } from '../infrastructure/supabaseCheckinRealtime';

/** Agrupa una ráfaga de eventos en una sola consulta. */
const CHANGE_DEBOUNCE_MS = 300;

async function loadWeek(now: Date): Promise<WeekMoodDay[]> {
  const userId = await supabaseAuthGateway.getCurrentUserId();
  if (!userId) return summarizeWeek([], now);
  const local = await getLocalCheckinStore(userId);
  const { from, to } = currentWeekRange(now);
  // Combina Supabase con los pendientes de la outbox cifrada; sin red quedan solo los locales.
  const { entries } = await loadCheckinHistory(local, supabaseCheckinGateway, {
    from: from.toISOString(),
    to: to.toISOString(),
  });
  return summarizeWeek(entries, now);
}

/**
 * Ánimo de la semana actual, día por día. Se consulta al enfocar la vista y al
 * volver la app a primer plano; mientras tanto escucha por Realtime los check-ins
 * propios hechos en otra sesión. La suscripción se cierra al salir de la vista o
 * al pasar la app a segundo plano.
 */
export function useWeekMood(): WeekMoodDay[] {
  const [days, setDays] = useState<WeekMoodDay[]>(() => summarizeWeek([], new Date()));

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let debounce: ReturnType<typeof setTimeout> | undefined;
      let unsubscribe: (() => void) | null = null;
      let subscribing = false;

      const load = () => {
        const now = new Date();
        loadWeek(now).then(
          (week) => active && setDays(week),
          // Sin sesión o con un error se conserva lo último que se mostró.
          () => undefined,
        );
      };

      const scheduleLoad = () => {
        clearTimeout(debounce);
        debounce = setTimeout(load, CHANGE_DEBOUNCE_MS);
      };

      const subscribe = () => {
        if (unsubscribe || subscribing) return;
        subscribing = true;
        supabaseCheckinChangeFeed.subscribe(scheduleLoad).then(
          (stop) => {
            subscribing = false;
            // La vista pudo cerrarse o la app irse a segundo plano mientras se conectaba.
            if (!active || AppState.currentState !== 'active') stop();
            else unsubscribe = stop;
          },
          () => {
            // Sin red o sin perfil: se reintenta al volver a primer plano o a la vista.
            subscribing = false;
          },
        );
      };

      const unsubscribeNow = () => {
        unsubscribe?.();
        unsubscribe = null;
      };

      load();
      subscribe();
      const appState = AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          load();
          subscribe();
        } else {
          unsubscribeNow();
        }
      });

      return () => {
        active = false;
        clearTimeout(debounce);
        appState.remove();
        unsubscribeNow();
      };
    }, []),
  );

  return days;
}
