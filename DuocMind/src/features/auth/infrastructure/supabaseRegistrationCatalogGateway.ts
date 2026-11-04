import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';
import { parseCareers } from '../domain/registration';
import type { RegistrationCatalogGateway } from '../application/registrationCatalog';

export const supabaseRegistrationCatalogGateway: RegistrationCatalogGateway = {
  async fetch() {
    // Catálogo público: se lee antes de tener sesión, con la política de lectura abierta.
    const careers = await getSupabaseClient().from('carrera').select('id_carrera, nombre_carrera, sede_id_sede');
    if (careers.error) throw careers.error;
    return { careers: parseCareers(careers.data) };
  },
};
