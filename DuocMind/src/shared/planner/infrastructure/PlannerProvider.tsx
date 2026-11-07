import { type PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import type { ScheduleDocument } from '../domain/schedule';
import type { PlannerSnapshot } from '../application/plannerService';
import type { PersonalActivity } from '../application/plannerStore';
import type { ActivityTransfer } from '../application/personalActivities';
import type { LegacyCatalog, LegacyEntry } from '../application/legacyActivities';
import type { PlannerSession } from '../application/plannerContracts';
import { startPlannerPolling } from '../application/plannerPolling';
import { PlannerContext, type PlannerModel } from '../application/plannerContext';
import { plannerSessionGateway } from './plannerSessionGateway';
import { plannerService } from './plannerRuntime';
const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'No se pudo completar la operación. Tus datos se conservan.';
export function PlannerProvider({ children }: PropsWithChildren) {
  const [snapshot, setSnapshot] = useState<PlannerSnapshot | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null),
    [now, setNow] = useState(() => new Date());
  const alive = useRef(false),
    sequence = useRef(0),
    epoch = useRef(0),
    current = useRef<PlannerSnapshot | null>(null),
    mutating = useRef(false);
  const loadLocal = useCallback(async () => {
    const seq = ++sequence.current;
    try {
      const result = await plannerService.snapshot();
      if (alive.current && seq === sequence.current) {
        current.current = result;
        setSnapshot(result);
        setError(null);
      }
    } catch (e) {
      if (alive.current && seq === sequence.current) setError(message(e));
    } finally {
      if (alive.current && seq === sequence.current) setLoading(false);
    }
  }, []);
  const loadAndVerify = useCallback(async () => {
    await loadLocal();
    const view = current.current;
    // Si la limpieza falla, el bloqueo de la cuenta ya impide usar sus datos.
    if (view) await plannerService.verifyAccount(view.session).catch(() => undefined);
  }, [loadLocal]);
  useEffect(() => {
    alive.current = true;
    void loadAndVerify();
    const stopData = plannerService.subscribe(() => {
      if (alive.current) void loadLocal();
    });
    const stopSession = plannerSessionGateway.subscribe(() => {
      epoch.current += 1;
      sequence.current += 1;
      current.current = null;
      mutating.current = false;
      setSnapshot(null);
      setLoading(true);
      setBusy(false);
      setError(null);
      if (alive.current) void loadAndVerify();
    });
    let stopPolling = () => {};
    const start = () => {
      stopPolling();
      stopPolling = startPlannerPolling(() => setNow(new Date()));
    };
    if (AppState.currentState === 'active') start();
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setNow(new Date());
        void loadAndVerify();
        start();
      } else stopPolling();
    });
    const onStorage = (event: StorageEvent) => {
      if (event.key?.startsWith('duocmind.planner.v1.')) void loadLocal();
    };
    if (Platform.OS === 'web') window.addEventListener('storage', onStorage);
    return () => {
      alive.current = false;
      sequence.current += 1;
      stopData();
      stopSession();
      stopPolling();
      app.remove();
      if (Platform.OS === 'web') window.removeEventListener('storage', onStorage);
    };
  }, [loadAndVerify, loadLocal]);
  async function run<T>(action: (session: PlannerSession) => Promise<T>): Promise<T> {
    const view = current.current;
    if (!view) throw new Error('Espera a que cargue tu agenda.');
    if (mutating.current) throw new Error('Espera a que termine el guardado.');
    mutating.current = true;
    setBusy(true);
    setError(null);
    const version = epoch.current;
    try {
      const result = await action(view.session);
      if (epoch.current !== version) throw new Error('La sesión cambió.');
      await loadLocal();
      return result;
    } catch (e) {
      if (alive.current && epoch.current === version) setError(message(e));
      throw e;
    } finally {
      if (epoch.current === version) {
        mutating.current = false;
        if (alive.current) setBusy(false);
      }
    }
  }
  const model: PlannerModel = {
    snapshot,
    loading,
    busy,
    error,
    now,
    refresh: loadLocal,
    editSchedule: (expected, edit) =>
      run((session) => plannerService.editSchedule(session, expected, edit)),
    saveActivity: (activity) => run((session) => plannerService.saveActivity(session, activity)),
    removeActivity: (id, version) =>
      run((session) => plannerService.removeActivity(session, id, version)),
    transfer: (request) => run((session) => plannerService.transfer(session, request)),
    listLegacy: (accepted) => run((session) => plannerService.listLegacy(session, accepted)),
    importLegacy: (entries) => run((session) => plannerService.importLegacy(session, entries)),
  };
  return <PlannerContext.Provider value={model}>{children}</PlannerContext.Provider>;
}
