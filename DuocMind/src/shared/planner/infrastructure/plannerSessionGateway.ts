import NetInfo from '@react-native-community/netinfo';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import {
  platformAuthStorage,
  platformSecureKeyValueStorage,
} from '@/shared/backend/infrastructure/platformSecureStorage';
import { supabaseAuthStorageKey } from '@/shared/backend/infrastructure/supabaseAuthOptions';
import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';
import { persistedPlannerOwner, PlannerSessionCoordinator } from '../application/plannerSession';
import { PlannerAuthError, type PlannerSessionGateway } from '../application/plannerContracts';
import { createScheduleGateway } from './scheduleGateway';
import { deletePlannerData } from './plannerStorage';
const coordinator = new PlannerSessionCoordinator();
let listening = false, revision = 0;
export const deletionMarker = (id: string) => `duocmind.planner.deleting.v1.${id}`;
function start(): void {
  if (listening) return;
  getSupabaseClient().auth.onAuthStateChange((event, session) => {
    if (event === 'INITIAL_SESSION' && !session) return;
    revision += 1;
    coordinator.setUser(session?.user.id ?? null);
  });
  listening = true;
}
export const plannerSessionGateway: PlannerSessionGateway = {
  async current() {
    start();
    const before = revision;
    let owner: string | null = null;
    const network = await NetInfo.fetch();
    if (network.isConnected === false) {
      const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!url) throw new PlannerAuthError();
      owner = persistedPlannerOwner(await platformAuthStorage.getItem(supabaseAuthStorageKey(url)));
    } else {
      const { data, error } = await getSupabaseClient().auth.getSession();
      if (error) {
        if (!isAuthRetryableFetchError(error)) throw new PlannerAuthError();
        const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
        if (!url) throw new PlannerAuthError();
        owner = persistedPlannerOwner(
          await platformAuthStorage.getItem(supabaseAuthStorageKey(url)),
        );
      } else owner = data.session?.user.id ?? null;
    }
    if (owner) {
      if (await platformSecureKeyValueStorage.getItem(deletionMarker(owner)) === 'true') {
        coordinator.block(owner);
      }
      const verified = await platformSecureKeyValueStorage.getItem(
        `duocmind.student-profile-verified.v1.${owner}`,
      );
      if (verified !== 'true') owner = null;
    }
    if (revision !== before) return this.current();
    coordinator.setUser(owner);
    return coordinator.capture();
  },
  async isCurrent(session) {
    return coordinator.matches(session);
  },
  subscribe(listener) {
    try {
      start();
    } catch { /* La carga informa la configuración ausente. */ }
    return coordinator.subscribe(listener);
  },
};
export async function blockPlannerAccount(userId: string): Promise<void> {
  await platformSecureKeyValueStorage.setItem(deletionMarker(userId), 'true');
  coordinator.block(userId);
}
export const supabaseScheduleGateway = createScheduleGateway(async (name, args, session) => {
  const client = getSupabaseClient(), { data, error } = await client.auth.getSession();
  if (
    error || !data.session || data.session.user.id !== session.userId ||
    !await plannerSessionGateway.isCurrent(session)
  ) throw new PlannerAuthError();
  if (name === 'load_personal_schedule') {
    const verified = await client.auth.getUser(data.session.access_token);
    if (verified.error?.code === 'user_not_found') {
      await blockPlannerAccount(session.userId);
      await deletePlannerData(session.userId);
      throw new PlannerAuthError();
    }
    if (verified.error) {
      if (isAuthRetryableFetchError(verified.error)) {
        throw new Error('No pudimos verificar la conexión. Tus datos locales se conservan.');
      }
      throw new PlannerAuthError();
    }
    if (!await plannerSessionGateway.isCurrent(session)) throw new PlannerAuthError();
  }
  // Fija el token capturado: un cambio de cuenta no puede enviar esta operación con otro JWT.
  const result = await client.rpc(name, args).setHeader(
    'Authorization',
    `Bearer ${data.session.access_token}`,
  );
  return { data: result.data as unknown, error: result.error };
});
