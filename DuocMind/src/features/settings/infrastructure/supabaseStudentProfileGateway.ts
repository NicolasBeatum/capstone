import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';
import type { StudentProfileGateway } from '../application/studentProfile';
import { parseCareerName, parseStudentProfile } from '../domain/studentProfile';

const PROFILE_COLUMNS =
  'id_estudiante, rut, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, numero_telefonico, correo';

/** Lee el perfil propio; RLS limita la consulta a la fila de la cuenta con sesión. */
export const supabaseStudentProfileGateway: StudentProfileGateway = {
  async fetchProfile() {
    const client = getSupabaseClient();
    // getSession lee la sesión guardada en el dispositivo, sin ir a la red.
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    const user = sessionData.session?.user;
    if (!user) return null;

    const { data, error } = await client
      .from('estudiante')
      .select(PROFILE_COLUMNS)
      .eq('auth_user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    // La carrera es un dato accesorio: si no se puede leer, el resto del perfil se muestra igual.
    let career: string | null = null;
    try {
      const { data: careerRow, error: careerError } = await client
        .from('estudiante_carrera')
        .select('carrera(nombre_carrera)')
        .eq('estudiante_id_estudiante', (data as { id_estudiante: number }).id_estudiante)
        .is('fecha_fin', null)
        .maybeSingle();
      if (!careerError) career = parseCareerName(careerRow);
    } catch {
      career = null;
    }

    return parseStudentProfile(data, career, user.email ?? null);
  },
};
