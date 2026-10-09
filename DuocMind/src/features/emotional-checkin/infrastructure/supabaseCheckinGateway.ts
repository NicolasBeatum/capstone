import type { CheckinMood, LocalCheckin } from '../application/localCheckinStore';
import type {
  CheckinHistoryEntry,
  CheckinRange,
  CheckinRemoteGateway,
} from '../application/checkinHistory';
import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';

interface StudentRow {
  id_estudiante: number;
}

interface GeneralEmotionRow {
  id_emocion: number;
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