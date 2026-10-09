import type { CheckinChangeFeed } from '../application/checkinHistory';
import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';
import { getStudentId } from './supabaseCheckinGateway';

// Cada suscripción usa un canal propio: si el anterior aún se está cerrando, no se reutiliza.
let channelCount = 0;

/**
 * Escucha por WebSocket (Supabase Realtime) las inserciones de check-ins del
 * estudiante actual. Solo INSERT y filtrado por el estudiante propio: los DELETE
 * no admiten filtro y entregarían a todos la clave de registros ajenos. El evento
 * solo avisa; su contenido no se usa ni se guarda.
 */
export const supabaseCheckinChangeFeed: CheckinChangeFeed = {
  async subscribe(onChange) {
    const studentId = await getStudentId();
    const client = getSupabaseClient();
    channelCount += 1;
    const channel = client
      .channel(`registro-emocional-${studentId}-${channelCount}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'registro_emocional',
          filter: `estudiante_id_estudiante=eq.${studentId}`,
        },
        () => onChange(),
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  },
};
