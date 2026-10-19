import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';

export interface StudentDisplayName {
  firstName: string;
  lastName: string;
}

/* Caché en memoria por usuario: al volver al dashboard el nombre está al instante,
   y si cambia la sesión se vuelve a consultar. */
let cache: { userId: string; name: StudentDisplayName | null } | undefined;

/** Nombre del estudiante con sesión activa, o null si no hay sesión o perfil. */
export async function fetchStudentDisplayName(): Promise<StudentDisplayName | null> {
  const client = getSupabaseClient();
  // getSession lee la sesión guardada en el dispositivo, sin ir a la red.
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError) throw sessionError;
  const userId = sessionData.session?.user.id;
  if (!userId) return null;
  if (cache?.userId === userId) return cache.name;

  const { data, error } = await client
    .from('estudiante')
    .select('primer_nombre, primer_apellido')
    .eq('auth_user_id', userId)
    .maybeSingle<{ primer_nombre: string; primer_apellido: string }>();
  if (error) throw error;
  const name = data ? { firstName: data.primer_nombre, lastName: data.primer_apellido } : null;
  cache = { userId, name };
  return name;
}
