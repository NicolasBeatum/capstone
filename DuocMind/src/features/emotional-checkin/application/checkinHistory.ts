import type {
  CheckinMood,
  CheckinSyncStatus,
  LocalCheckin,
  NewLocalCheckin,
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

/** Intervalo [from, to) en ISO 8601. */
export interface CheckinRange {
  from: string;
  to: string;
}

export interface CheckinLocalRepository {
  savePending(checkin: NewLocalCheckin): Promise<void>;
  saveDeviceOnly(checkin: NewLocalCheckin): Promise<void>;
  listAll(): Promise<LocalCheckin[]>;
  listPending(): Promise<LocalCheckin[]>;
  markSynced(clientRequestId: string): Promise<void>;
  remove(clientRequestId: string): Promise<void>;
}

export interface CheckinRemoteGateway {
  /** Sube el registro y sus motivos; termina solo si ambos quedaron guardados. Es idempotente. */
  save(checkin: Omit<LocalCheckin, 'syncStatus'>): Promise<void>;
  list(range?: CheckinRange): Promise<CheckinHistoryEntry[]>;
  remove(clientRequestId: string): Promise<void>;
}

/** Avisa cuando llega un check-in propio nuevo; devuelve cómo dejar de escuchar. */
export interface CheckinChangeFeed {
  subscribe(onChange: () => void): Promise<() => void>;
}

export type SaveCheckinResult = {
  clientRequestId: string;
  syncStatus: CheckinSyncStatus;
};

/** Responde si hoy se permite enviar datos emocionales al servidor; no debe lanzar. */
export type EmotionalUploadPolicy = () => Promise<boolean>;

/**
 * Sube la cola de envío solo si la persona lo permite. Sin permiso los pendientes esperan;
 * los registrados sin consentimiento (`device`) nunca están en esta cola.
 */
export async function syncPendingCheckins(
  local: CheckinLocalRepository,
  remote: CheckinRemoteGateway,
  canUpload: EmotionalUploadPolicy,
): Promise<void> {
  if (!(await canUpload())) return;
  const pending = await local.listPending();
  for (const checkin of pending) {
    await remote.save(checkin);
    await local.markSynced(checkin.clientRequestId);
  }
}

/**
 * Guarda el check-in. El permiso se decide al registrar: sin consentimientos activos queda
 * como `device` y no se envía nunca, ni siquiera si después se activa un consentimiento.
 */
export async function saveConfirmedCheckin(
  mood: CheckinMood,
  dependencies: {
    local: CheckinLocalRepository;
    remote: CheckinRemoteGateway;
    canUpload: EmotionalUploadPolicy;
    createRequestId(): string;
    now(): Date;
  },
  reasonIds: readonly number[] = [],
): Promise<SaveCheckinResult> {
  const checkin: NewLocalCheckin = {
    clientRequestId: dependencies.createRequestId(),
    mood,
    createdAt: dependencies.now().toISOString(),
    reasonIds: [...reasonIds],
  };

  if (await dependencies.canUpload()) {
    await dependencies.local.savePending(checkin);
    try {
      await syncPendingCheckins(dependencies.local, dependencies.remote, dependencies.canUpload);
    } catch {
      // The encrypted local outbox remains authoritative until sync succeeds.
    }
  } else {
    await dependencies.local.saveDeviceOnly(checkin);
  }

  const saved = (await dependencies.local.listAll()).find(
    (entry) => entry.clientRequestId === checkin.clientRequestId,
  );
  if (!saved) throw new Error('No se pudo conservar el check-in en este dispositivo.');

  return { clientRequestId: saved.clientRequestId, syncStatus: saved.syncStatus };
}

function isInRange(createdAt: string, range: CheckinRange): boolean {
  const time = Date.parse(createdAt);
  return time >= Date.parse(range.from) && time < Date.parse(range.to);
}

export async function loadCheckinHistory(
  local: CheckinLocalRepository,
  remote: CheckinRemoteGateway,
  range?: CheckinRange,
): Promise<CheckinHistoryResult> {
  const allLocal = await local.listAll();
  const localEntries = range ? allLocal.filter((entry) => isInRange(entry.createdAt, range)) : allLocal;
  let remoteEntries: CheckinHistoryEntry[] = [];
  let remoteAvailable = true;
  try {
    remoteEntries = await remote.list(range);
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