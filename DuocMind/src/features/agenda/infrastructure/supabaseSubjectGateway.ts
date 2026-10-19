import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';
import { parseSubjects, type AgendaSubject } from '@/shared/subjects/domain/subject';
import type { SubjectGateway } from '../application/subjectCatalog';

interface EnrollmentRow {
  carrera_asignatura: {
    asignatura: { id_asignatura: number | string; nombre_asignatura: string; codigo: string };
  };
}

export const supabaseSubjectGateway: SubjectGateway = {
  async getOwnerId() {
    // getSession lee la sesión guardada en el dispositivo, sin ir a la red.
    const { data, error } = await getSupabaseClient().auth.getSession();
    if (error) throw error;
    return data.session?.user.id ?? null;
  },

  async fetch(): Promise<AgendaSubject[]> {
    // La RLS limita las inscripciones a la cuenta con sesión; solo cuenta la carrera vigente.
    const { data, error } = await getSupabaseClient()
      .from('estudiante_asignatura')
      .select('estudiante_carrera!inner(fecha_fin), carrera_asignatura!inner(asignatura!inner(id_asignatura, nombre_asignatura, codigo))')
      .is('estudiante_carrera.fecha_fin', null)
      .returns<EnrollmentRow[]>();
    if (error) throw error;
    return parseSubjects(
      data.map((row) => ({
        id: String(row.carrera_asignatura.asignatura.id_asignatura),
        name: row.carrera_asignatura.asignatura.nombre_asignatura,
        code: row.carrera_asignatura.asignatura.codigo,
      })),
    );
  },
};
