import NetInfo from '@react-native-community/netinfo';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { platformAuthStorage } from '@/shared/backend/infrastructure/platformSecureStorage';
import { supabaseAuthStorageKey } from '@/shared/backend/infrastructure/supabaseAuthOptions';
import { persistedEventOwner } from '../application/persistedEventOwner';
import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';
import { EventSessionCoordinator } from '../application/eventSession';
import type { EventSessionGateway } from '../application/eventStore';
const coordinator = new EventSessionCoordinator();
let listening = false;
let sessionRevision = 0;
function start(): void {
  if (listening) return;
  getSupabaseClient().auth.onAuthStateChange((event, session) => {
    if (event === 'INITIAL_SESSION' && !session) return;
    sessionRevision += 1; coordinator.setUser(session?.user.id ?? null);
  });
  listening = true;
}
async function storedOwner(): Promise<string | null> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('Falta la configuración pública de Supabase.');
  return persistedEventOwner(await platformAuthStorage.getItem(supabaseAuthStorageKey(url)));
}
export const eventSessionGateway: EventSessionGateway = {
  async current() {
    start();
    const revision = sessionRevision;
    const network = await NetInfo.fetch();
    if (network.isConnected === false) {
      const owner = await storedOwner();
      if (sessionRevision === revision) coordinator.setUser(owner);
      return coordinator.capture();
    }
    const { data, error } = await getSupabaseClient().auth.getSession();
    if (error) {
      if (!isAuthRetryableFetchError(error)) throw new Error('No se pudo leer tu sesión.');
      const owner = await storedOwner();
      if (sessionRevision === revision) coordinator.setUser(owner);
    } else if (sessionRevision === revision) coordinator.setUser(data.session?.user.id ?? null);
    return coordinator.capture();
  },
  async isCurrent(session) {
    await this.current();
    return coordinator.matches(session);
  },
  subscribe(listener) {
    try { start(); } catch { /* La carga comunica la configuración ausente. */ }
    return coordinator.subscribe(listener);
  },
};
export function blockEventAccount(userId: string): () => void { return coordinator.block(userId); }
