import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from 'expo-router';
import { startEventPolling } from './eventPolling';
import { EventServiceContext } from './eventContext';
import type { EventSnapshot } from './eventService';
import type { InstitutionalEvent } from '../domain/institutionalEvent';
export function useEvents() {
  const service = useContext(EventServiceContext);
  if (!service) throw new Error('No se pudo iniciar el servicio de eventos.');
  const [snapshot, setSnapshot] = useState<EventSnapshot | null>(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null), [message, setMessage] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const active = useRef(false), request = useRef(0), pending = useRef(false), epoch = useRef(0), connected = useRef(true);
  const refresh = useCallback(async (remote = true) => {
    const sequence = ++request.current;
    try {
      const result = await service.load(remote);
      if (active.current && sequence === request.current) {
        setSnapshot(previous => {
          const next = !remote && previous?.session.userId === result.session.userId
            ? { ...result, offline: previous.offline, warning: previous.warning } : result;
          return connected.current ? next : { ...next, offline: true, warning: 'Sin conexión. Se muestra la última información disponible.' };
        });
        setError(null); setNow(new Date());
      }
    } catch (e) {
      if (active.current && sequence === request.current) setError(e instanceof Error ? e.message : 'No se pudieron cargar los eventos.');
    } finally { if (active.current && sequence === request.current) setLoading(false); }
  }, [service]);
  useEffect(() => service.subscribe(reason => {
    if (reason === 'session') {
      epoch.current += 1; request.current += 1; pending.current = false;
      setBusy(false); setSnapshot(null); setMessage(null); setError(null); setLoading(true);
    }
    if (active.current) void refresh(reason === 'session');
  }), [refresh, service]);
  useFocusEffect(useCallback(() => {
    active.current = true;
    let stopPolling = () => {};
    const stopTimers = () => stopPolling();
    const startTimers = () => {
      stopPolling();
      stopPolling = startEventPolling(() => setNow(new Date()), () => void refresh(), () => connected.current);
    };
    void refresh();
    if (AppState.currentState === 'active') startTimers();
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') { setNow(new Date()); void refresh(); startTimers(); }
      else stopTimers();
    });
    let wasConnected: boolean | null = null;
    const stopNetwork = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected === true && state.isInternetReachable !== false;
      connected.current = isConnected;
      if (isConnected && wasConnected === false && AppState.currentState === 'active') void refresh();
      if (!isConnected) setSnapshot(previous => previous ? { ...previous, offline: true, warning: 'Sin conexión. Se muestra la última información disponible.' } : previous);
      wasConnected = isConnected;
    });
    return () => { active.current = false; request.current += 1; stopTimers(); appState.remove(); stopNetwork(); };
  }, [refresh, service]));
  const run = async (action: () => Promise<string>) => {
    if (pending.current || !snapshot) return;
    pending.current = true; setBusy(true); setError(null); setMessage(null);
    const operationEpoch = epoch.current;
    try {
      const result = await action();
      if (active.current && epoch.current === operationEpoch) { await refresh(false); if (epoch.current === operationEpoch) setMessage(result); }
    } catch (e) {
      if (active.current && epoch.current === operationEpoch) { await refresh(false); if (epoch.current === operationEpoch) setError(e instanceof Error ? e.message : 'No se pudo completar la acción.'); }
    } finally { if (epoch.current === operationEpoch) { pending.current = false; if (active.current) setBusy(false); } }
  };
  return {
    snapshot, loading, busy, error, message, now, refresh: () => refresh(true),
    add: (event: InstitutionalEvent) => snapshot && run(() => service.add(event, snapshot.session)),
    remove: (id: string) => snapshot && run(() => service.remove(id, snapshot.session)),
    accept: (event: InstitutionalEvent, version: number) => snapshot && run(() => service.accept(event, version, snapshot.session)),
    register: (event: InstitutionalEvent) => snapshot && run(() => service.register(event, snapshot.session)),
  };
}
