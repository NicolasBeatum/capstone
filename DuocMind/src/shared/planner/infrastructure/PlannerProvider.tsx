import { type PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import type { ScheduleDocument } from '../domain/schedule';
import { type PlannerSnapshot, plannerStatus } from '../application/plannerService';
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
    [busy, setBusy] = useState(false),
    [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null),
    [syncError, setSyncError] = useState<string | null>(null),
    [now, setNow] = useState(() => new Date());
  const alive = useRef(false),
    sequence = useRef(0),
    epoch = useRef(0),
    connected = useRef(true),
    current = useRef<PlannerSnapshot | null>(null),
    mutating = useRef(false),
    syncWork = useRef<Promise<void> | null>(null);
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
  const synchronize = useCallback(async () => {
    if (syncWork.current) return syncWork.current;
    if (!connected.current || AppState.currentState !== 'active') return;
    const version = epoch.current;
    const work = (async () => {
      try {
        const view = await plannerService.snapshot();
        if (!alive.current || epoch.current !== version) return;
        setSyncing(true);
        await plannerService.sync(view.session);
        if (alive.current && epoch.current === version) {
          setSyncError(null);
          await loadLocal();
        }
      } catch (e) {
        if (alive.current && epoch.current === version) {
          setSyncError(message(e));
          await loadLocal();
        }
      } finally {
        if (alive.current && epoch.current === version) setSyncing(false);
      }
    })();
    syncWork.current = work;
    try {
      await work;
    } finally {
      if (syncWork.current === work) syncWork.current = null;
    }
  }, [loadLocal]);
  useEffect(() => {
    alive.current = true;
    void loadLocal().then(() => synchronize());
    const stopData = plannerService.subscribe(() => {
      if (alive.current) void loadLocal();
    });
    const stopSession = plannerSessionGateway.subscribe(() => {
      epoch.current += 1;
      sequence.current += 1;
      current.current = null;
      syncWork.current = null;
      mutating.current = false;
      setSnapshot(null);
      setLoading(true);
      setBusy(false);
      setSyncing(false);
      setSyncError(null);
      setError(null);
      if (alive.current) void loadLocal().then(() => synchronize());
    });
    let stopPolling = () => {};
    const start = () => {
      stopPolling();
      stopPolling = startPlannerPolling(
        () => setNow(new Date()),
        () => void synchronize(),
        () => connected.current,
      );
    };
    if (AppState.currentState === 'active') start();
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setNow(new Date());
        void loadLocal().then(() => synchronize());
        start();
      } else stopPolling();
    });
    let previouslyConnected: boolean | null = null;
    const stopNetwork = NetInfo.addEventListener((state) => {
      connected.current = state.isConnected === true && state.isInternetReachable !== false;
      if (connected.current && previouslyConnected !== true) void synchronize();
      previouslyConnected = connected.current;
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
      stopNetwork();
      if (Platform.OS === 'web') window.removeEventListener('storage', onStorage);
    };
  }, [loadLocal, synchronize]);
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
  const refresh = useCallback(async () => {
    await loadLocal();
    await synchronize();
  }, [loadLocal, synchronize]);
  const model: PlannerModel = {
    snapshot,
    loading,
    busy,
    syncing,
    error,
    syncError,
    now,
    status: snapshot ? plannerStatus(snapshot.document) : 'local',
    refresh,
    async editSchedule(expected, edit) {
      await run((session) => plannerService.editSchedule(session, expected, edit));
      void synchronize();
    },
    saveActivity: (activity) => run((session) => plannerService.saveActivity(session, activity)),
    removeActivity: (id, version) =>
      run((session) => plannerService.removeActivity(session, id, version)),
    transfer: (request) => run((session) => plannerService.transfer(session, request)),
    listLegacy: (accepted) => run((session) => plannerService.listLegacy(session, accepted)),
    importLegacy: (entries) => run((session) => plannerService.importLegacy(session, entries)),
    async resolve(expected, revision, choice) {
      await run((session) => plannerService.resolve(session, expected, revision, choice));
      void synchronize();
    },
  };
  return <PlannerContext.Provider value={model}>{children}</PlannerContext.Provider>;
}
