import { supabaseConnectionGateway } from '../infrastructure/supabaseConnectionGateway';

export type BackendConnectionStatus =
  | 'connected'
  | 'missing-config'
  | 'offline'
  | 'unavailable';

export interface BackendConnectionGateway {
  check(): Promise<BackendConnectionStatus>;
}

export function checkBackendConnection(
  gateway: BackendConnectionGateway = supabaseConnectionGateway,
): Promise<BackendConnectionStatus> {
  return gateway.check();
}
