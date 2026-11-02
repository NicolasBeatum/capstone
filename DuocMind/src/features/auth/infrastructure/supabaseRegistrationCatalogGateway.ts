import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';
import { parseCampuses, parseCareers } from '../domain/registration';
import type { RegistrationCatalogGateway } from '../application/registrationCatalog';

export const supabaseRegistrationCatalogGateway: RegistrationCatalogGateway = {
  async fetch() {
    // Catálogos públicos: se leen antes de tener sesión, con la política de lectura abierta.
    const client = getSupabaseClient();
    const [campuses, careers] = await Promise.all([
      client.from('sede').select('id_sede, nombre_sede'),
      client.from('carrera').select('id_carrera, nombre_carrera, sede_id_sede'),
    ]);
    if (campuses.error) throw campuses.error;
    if (careers.error) throw careers.error;
    return { campuses: parseCampuses(campuses.data), careers: parseCareers(careers.data) };
  },
};
