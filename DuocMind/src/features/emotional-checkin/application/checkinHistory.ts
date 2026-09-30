import type {
  CheckinMood,
  CheckinSyncStatus,
  LocalCheckin,
} from './localCheckinStore';

export interface CheckinHistoryEntry {
  clientRequestId: string;
  mood: CheckinMood;
  createdAt: string;
  syncStatus: CheckinSyncStatus;
}

export interface CheckinHistoryResult {
  entries: CheckinHistoryEntry[];
  remoteAvailable: boolean;
}

export interface CheckinLocalRepository {
  savePending(checkin: Omit<LocalCheckin, 'syncStatus'>): Promise<void>;
  listAll(): Promise<LocalCheckin[]>;
  listPending(): Promise<LocalCheckin[]>;
  markSynced(clientRequestId: string): Promise<void>;
  remove(clientRequestId: string): Promise<void>;
}

export interface CheckinRemoteGateway {
  save(checkin: Omit<LocalCheckin, 'syncStatus'>): Promise<void>;
  list(): Promise<CheckinHistoryEntry[]>;
  remove(clientRequestId: string): Promise<void>;
}

export type SaveCheckinResult = {
  clientRequestId: string;
  syncStatus: CheckinSyncStatus;
};

export async function syncPendingCheckins(
  local: CheckinLocalRepository,
  remote: CheckinRemoteGateway,
): Promise<void> {
  const pending = await local.listPending();
  for (const checkin of pending) {
    await remote.save(checkin);
    await local.markSynced(checkin.clientRequestId);
  }
}

export async function saveConfirmedCheckin(
  mood: CheckinMood,
  dependencies: {
    local: CheckinLocalRepository;
    remote: CheckinRemoteGateway;
    createRequestId(): string;
    now(): Date;
  },
): Promise<SaveCheckinResult> {
  const checkin = {
    clientRequestId: dependencies.createRequestId(),
    mood,
    createdAt: dependencies.now().toISOString(),
  };

  await dependencies.local.savePending(checkin);
  try {
    await syncPendingCheckins(dependencies.local, dependencies.remote);
  } catch {
    // The encrypted local outbox remains authoritative until sync succeeds.
  }

  const saved = (await dependencies.local.listAll()).find(
    (entry) => entry.clientRequestId === checkin.clientRequestId,
  );
  if (!saved) throw new Error('No se pudo conservar el check-in en este dispositivo.');

  return { clientRequestId: saved.clientRequestId, syncStatus: saved.syncStatus };
}

export async function loadCheckinHistory(
  local: CheckinLocalRepository,
  remote: CheckinRemoteGateway,
): Promise<CheckinHistoryResult> {
  const localEntries = await local.listAll();
  let remoteEntries: CheckinHistoryEntry[] = [];
  let remoteAvailable = true;
  try {
    remoteEntries = await remote.list();
  } catch {
    remoteAvailable = false;
  }

  const entries = new Map<string, CheckinHistoryEntry>();
  for (const entry of remoteEntries) entries.set(entry.clientRequestId, entry);
  for (const entry of localEntries) {
    if (!entries.has(entry.clientRequestId)) entries.set(entry.clientRequestId, entry);
  }

  return {
    entries: [...entries.values()].sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
    ),
    remoteAvailable,
  };
}

export async function deleteCheckin(
  clientRequestId: string,
  dependencies: { local: CheckinLocalRepository; remote: CheckinRemoteGateway },
): Promise<void> {
  const entry = (await dependencies.local.listAll()).find(
    (checkin) => checkin.clientRequestId === clientRequestId,
  );
  if (!entry) return;

  if (entry.syncStatus === 'synced') {
    await dependencies.remote.remove(clientRequestId);
  }
  await dependencies.local.remove(clientRequestId);
}