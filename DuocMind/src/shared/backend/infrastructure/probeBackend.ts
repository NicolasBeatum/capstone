import type { BackendConnectionStatus } from '../application/checkBackendConnection';

export interface BackendConfig {
  url: string | undefined;
  publishableKey: string | undefined;
}

export interface NetworkState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}

export interface ProbeDependencies {
  initializeClient(url: string, publishableKey: string): void;
  getNetworkState(): Promise<NetworkState>;
  refreshNetworkState(): Promise<NetworkState>;
  requestHealth(url: string, publishableKey: string): Promise<boolean>;
}

const PROJECT_HOST = 'ashgvanzjeaeekpygqgy.supabase.co';
const PUBLISHABLE_KEY_PATTERN = /^sb_publishable_[A-Za-z0-9_-]+$/;

function validatedConfig(config: BackendConfig): { url: string; publishableKey: string } | null {
  const urlValue = config.url?.trim();
  const publishableKey = config.publishableKey?.trim();

  if (!urlValue || !publishableKey || !PUBLISHABLE_KEY_PATTERN.test(publishableKey)) {
    return null;
  }

  try {
    const parsedUrl = new URL(urlValue);
    if (
      parsedUrl.protocol !== 'https:' ||
      parsedUrl.hostname !== PROJECT_HOST ||
      parsedUrl.port !== '' ||
      parsedUrl.pathname !== '/' ||
      parsedUrl.username !== '' ||
      parsedUrl.password !== '' ||
      parsedUrl.search !== '' ||
      parsedUrl.hash !== ''
    ) {
      return null;
    }

    return { url: parsedUrl.origin, publishableKey };
  } catch {
    return null;
  }
}

function isOffline(state: NetworkState): boolean {
  return state.isConnected === false || state.isInternetReachable === false;
}

export async function probeBackend(
  config: BackendConfig,
  dependencies: ProbeDependencies,
): Promise<BackendConnectionStatus> {
  const validated = validatedConfig(config);
  if (!validated) {
    return 'missing-config';
  }

  try {
    dependencies.initializeClient(validated.url, validated.publishableKey);
  } catch {
    return 'unavailable';
  }

  try {
    if (isOffline(await dependencies.getNetworkState())) {
      return 'offline';
    }
  } catch {
    // La conectividad desconocida no impide intentar la solicitud real.
  }

  try {
    return (await dependencies.requestHealth(validated.url, validated.publishableKey))
      ? 'connected'
      : 'unavailable';
  } catch {
    try {
      if (isOffline(await dependencies.refreshNetworkState())) {
        return 'offline';
      }
    } catch {
      // Un error de NetInfo tampoco demuestra falta de red.
    }
    return 'unavailable';
  }
}
