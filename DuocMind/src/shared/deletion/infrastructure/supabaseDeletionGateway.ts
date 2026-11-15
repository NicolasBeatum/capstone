import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';
import { parseDeletionStatus, serverDeletionKind, type DeletionGateway } from '../application/scheduledDeletion';

/** La RLS solo deja ver las solicitudes propias; pedir y cancelar pasa por RPC. */
export const supabaseDeletionGateway: DeletionGateway = {
  async status() {
    const { data, error } = await getSupabaseClient().from('solicitud_eliminacion').select('tipo, ejecutar_en');
    if (error) throw error;
    return parseDeletionStatus(data);
  },

  async request(kind) {
    const { data, error } = await getSupabaseClient().rpc('request_deletion', { p_tipo: serverDeletionKind(kind) });
    if (error) throw error;
    if (typeof data !== 'string' || Number.isNaN(Date.parse(data))) throw new Error('Respuesta de eliminación no válida.');
    return data;
  },

  async cancel(kind) {
    const { error } = await getSupabaseClient().rpc('cancel_deletion', { p_tipo: serverDeletionKind(kind) });
    if (error) throw error;
  },
};
