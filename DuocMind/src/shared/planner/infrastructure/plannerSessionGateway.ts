import NetInfo from '@react-native-community/netinfo';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import {
  platformAuthStorage,
  platformSecureKeyValueStorage,
} from '@/shared/backend/infrastructure/platformSecureStorage';
import { supabaseAuthStorageKey } from '@/shared/backend/infrastructure/supabaseAuthOptions';
import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';
import { persistedPlannerOwner, PlannerSessionCoordinator } from '../application/plannerSession';
import {
  type PlannerAccountGateway,
  PlannerAuthError,
  type PlannerSessionGateway,
} from '../application/plannerContracts';
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
export const plannerAccountGateway: PlannerAccountGateway = {
  async lookup(session) {
    const client = getSupabaseClient(), { data, error } = await client.auth.getSession();
    if (error || data.session?.user.id !== session.userId) return null;
    return (await client.auth.getUser(data.session.access_token)).error;
  },
  async erase(userId) {
    await blockPlannerAccount(userId);
    await deletePlannerData(userId);
  },
};
