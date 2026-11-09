import type { CheckinMood, LocalCheckin } from '../application/localCheckinStore';
import type {
  CheckinHistoryEntry,
  CheckinRange,
  CheckinRemoteGateway,
} from '../application/checkinHistory';
import type { ReasonCatalogGateway } from '../application/checkinReasons';
import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';

interface StudentRow {
  id_estudiante: number;
}

interface GeneralEmotionRow {
  id_emocion: number;
}

interface RecordIdRow {
  id_registro: number;
}

interface ReasonIdRow {
  id_motivo: number;
}

interface RemoteCheckinRow {
  id_registro: number;
  fecha_hora: string;
  client_request_id: string;
  emocion_general: {
    nombre_emocion: string;
  };
}

const MOOD_VALUES: Record<CheckinMood, number> = {
  'Muy mal': 1,
  Mal: 2,
  Neutro: 3,
  Bien: 4,
  'Muy bien': 5,
};

export async function getStudentId(): Promise<number> {
  const client = getSupabaseClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('Inicia sesión para ver tus check-ins.');

  const { data, error } = await client
    .from('estudiante')
    .select('id_estudiante')
    .eq('auth_user_id', userData.user.id)
    .maybeSingle<StudentRow>();
  if (error) throw error;
  if (!data) throw new Error('Completa tu perfil de estudiante antes de continuar.');
  return data.id_estudiante;
}

async function getGeneralEmotionId(mood: CheckinMood): Promise<number> {
  const { data, error } = await getSupabaseClient()
    .from('emocion_general')
    .select('id_emocion')
    .eq('valor_escala', MOOD_VALUES[mood])
    .single<GeneralEmotionRow>();
  if (error) throw error;
  return data.id_emocion;
}

/**
 * Asocia los motivos al registro ya subido. Es idempotente: las filas existentes se ignoran.
 * Solo se insertan motivos que siguen existiendo, para que uno borrado del catálogo no
 * deje el check-in atascado en la outbox con un error de clave foránea.
 */
async function saveReasons(clientRequestId: string, reasonIds: readonly number[]): Promise<void> {
  if (reasonIds.length === 0) return;
  const client = getSupabaseClient();

  const [record, existing] = await Promise.all([
    client
      .from('registro_emocional')
      .select('id_registro')
      .eq('client_request_id', clientRequestId)
      .single<RecordIdRow>(),
    client.from('motivo').select('id_motivo').in('id_motivo', [...reasonIds]).returns<ReasonIdRow[]>(),
  ]);
  if (record.error) throw record.error;
  if (existing.error) throw existing.error;

  const rows = existing.data.map((reason) => ({
    registro_emocional_id_registro: record.data.id_registro,
    motivo_id_motivo: reason.id_motivo,
  }));
  if (rows.length === 0) return;

  const { error } = await client.from('registro_emocional_motivo').upsert(rows, {
    onConflict: 'registro_emocional_id_registro,motivo_id_motivo',
    ignoreDuplicates: true,
  });
  if (error) throw error;
}

function mapRemoteRow(row: RemoteCheckinRow): CheckinHistoryEntry | null {
  const mood = row.emocion_general?.nombre_emocion;
  if (!mood || !Object.keys(MOOD_VALUES).includes(mood)) return null;

  return {
    clientRequestId: row.client_request_id,
    mood: mood as CheckinMood,
    createdAt: row.fecha_hora,
    syncStatus: 'synced',
  };
}

export const supabaseCheckinGateway: CheckinRemoteGateway = {
  async save(checkin: Omit<LocalCheckin, 'syncStatus'>) {
    const [studentId, generalEmotionId] = await Promise.all([
      getStudentId(),
      getGeneralEmotionId(checkin.mood),
    ]);
    const { error } = await getSupabaseClient().from('registro_emocional').upsert(
      {
        client_request_id: checkin.clientRequestId,
        emocion_general_id_emocion: generalEmotionId,
        estudiante_id_estudiante: studentId,
        fecha_hora: checkin.createdAt,
      },
      { onConflict: 'client_request_id', ignoreDuplicates: true },
    );
    if (error) throw error;
    await saveReasons(checkin.clientRequestId, checkin.reasonIds ?? []);
  },

  async list(range?: CheckinRange) {
    const studentId = await getStudentId();
    let query = getSupabaseClient()
      .from('registro_emocional')
      .select(`
        id_registro,
        fecha_hora,
        client_request_id,
        emocion_general!inner(nombre_emocion)
      `)
      .eq('estudiante_id_estudiante', studentId);
    if (range) query = query.gte('fecha_hora', range.from).lt('fecha_hora', range.to);
    const { data, error } = await query
      .order('fecha_hora', { ascending: false })
      .returns<RemoteCheckinRow[]>();
    if (error) throw error;

    return data.map(mapRemoteRow).filter((entry): entry is CheckinHistoryEntry => entry !== null);
  },

  async remove(clientRequestId: string) {
    const studentId = await getStudentId();
    const { error } = await getSupabaseClient()
      .from('registro_emocional')
      .delete()
      .eq('client_request_id', clientRequestId)
      .eq('estudiante_id_estudiante', studentId);
    if (error) throw error;
  },
};
export const supabaseReasonCatalogGateway: ReasonCatalogGateway = {
  async fetchReasonCatalog() {
    const { data, error } = await getSupabaseClient()
      .from('motivo')
      .select('id_motivo, nombre_motivo, orden, activo')
      .eq('activo', true);
    if (error) throw error;
    return data;
  },
};
