import { UUID_PATTERN } from '../domain/institutionalEvent.ts';
// Identifica al propietario del almacenamiento local; no autoriza peticiones remotas.
export function persistedEventOwner(raw: string | null): string | null {
  if (raw === null) return null;
  try {
    const session: unknown = JSON.parse(raw);
    if (!session || typeof session !== 'object' || !('user' in session) || !session.user || typeof session.user !== 'object' ||
      !('id' in session.user) || typeof session.user.id !== 'string' || !UUID_PATTERN.test(session.user.id) ||
      !('access_token' in session) || typeof session.access_token !== 'string' || !session.access_token ||
      !('refresh_token' in session) || typeof session.refresh_token !== 'string' || !session.refresh_token ||
      !('expires_at' in session) || typeof session.expires_at !== 'number' || !Number.isFinite(session.expires_at)) throw Error();
    return session.user.id.toLowerCase();
  } catch { throw new Error('No se pudo leer tu sesión guardada.'); }
}
