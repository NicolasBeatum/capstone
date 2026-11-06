import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';
import type { RemoteConsentGateway } from '../application/consentSettings';
import { CONSENT_CODES, CONSENT_TEXT_VERSION, parseRemoteConsents } from '../domain/consents';

async function currentStudentId(): Promise<number> {
  const client = getSupabaseClient();
  const { data: session, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  const userId = session.session?.user.id;
  if (!userId) throw new Error('Inicia sesión para guardar tus consentimientos.');

  const { data, error } = await client
    .from('estudiante')
    .select('id_estudiante')
    .eq('auth_user_id', userId)
    .maybeSingle<{ id_estudiante: number }>();
  if (error) throw error;
  if (!data) throw new Error('Completa tu perfil de estudiante antes de continuar.');
  return data.id_estudiante;
}

/**
 * Historial de solo inserción: no se envía `registrado_en` (lo fija el servidor) y nunca
 * se actualiza ni se borra. Los errores no se registran porque pueden contener identificadores.
 */
export const consentRemoteGateway: RemoteConsentGateway = {
  async fetchCurrent() {
    const studentId = await currentStudentId();
    const client = getSupabaseClient();
    const [current, catalog] = await Promise.all([
      client
        .from('estudiante_consentimiento_actual')
        .select('consentimiento_id_consentimiento, otorgado')
        .eq('estudiante_id_estudiante', studentId),
      client.from('consentimiento').select('id_consentimiento, codigo'),
    ]);
    if (current.error) throw current.error;
    if (catalog.error) throw catalog.error;
    return parseRemoteConsents(current.data, catalog.data);
  },

  async record(key, granted) {
    const client = getSupabaseClient();
    const studentId = await currentStudentId();
    const { data: catalog, error: catalogError } = await client
      .from('consentimiento')
      .select('id_consentimiento')
      .eq('codigo', CONSENT_CODES[key])
      .maybeSingle<{ id_consentimiento: number }>();
    if (catalogError) throw catalogError;
    if (!catalog) throw new Error('El consentimiento no existe en el catálogo.');

    const { error } = await client.from('estudiante_consentimiento').insert({
      estudiante_id_estudiante: studentId,
      consentimiento_id_consentimiento: catalog.id_consentimiento,
      otorgado: granted,
      version: CONSENT_TEXT_VERSION,
    });
    if (error) throw error;
  },
};
