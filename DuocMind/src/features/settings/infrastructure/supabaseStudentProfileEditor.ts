import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';
import type { StudentProfileEditor } from '../application/studentProfileEdit';

/** Edita el perfil propio; RLS limita el UPDATE a la fila de la cuenta con sesión. */
export const supabaseStudentProfileEditor: StudentProfileEditor = {
  async updateProfile(patch) {
    const client = getSupabaseClient();
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    const user = sessionData.session?.user;
    if (!user) throw new Error('Sin sesión');

    // RLS descarta en silencio las filas ajenas: sin fila devuelta, el cambio no se aplicó.
    const { data, error } = await client
      .from('estudiante')
      .update(patch)
      .eq('auth_user_id', user.id)
      .select('id_estudiante');
    if (error) throw error;
    if (!data?.length) throw new Error('Perfil no actualizado');
  },

  async requestEmailChange(email) {
    const { error } = await getSupabaseClient().auth.updateUser({ email });
    if (error) throw error;
  },
};
