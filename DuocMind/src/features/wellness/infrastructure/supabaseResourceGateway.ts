import { getSupabaseClient } from '@/shared/backend/infrastructure/supabaseClient';
import type { ResourceGateway } from '../application/resourceCatalog';
import { parseCatalog } from '../domain/wellnessResource';
import { buildPublicImageUrl } from './resourceImageUrl';

/* El catálogo editorial de Bienestar son decenas de recursos; 200 deja un margen amplio, muy por
 * debajo del tope de 1000 filas de la API. */
const MAX_RESOURCES = 200;

/**
 * Lee las categorías y los recursos activos con las políticas de lectura pública existentes
 * (solo la clave publicable). Las dos consultas van juntas: si una falla no se usa ninguna.
 * Los errores no incluyen datos de la consulta. Sin reintentos automáticos del cliente (que con la red
 * caída tardaban unos 15 s en rendirse): ante un fallo se usa de inmediato la copia local, y la
 * sección vuelve a intentarlo al enfocar o con «Reintentar».
 */
export const supabaseResourceGateway: ResourceGateway = {
  async fetchCatalog() {
    const client = getSupabaseClient();
    const [categories, resources] = await Promise.all([
      client.from('tipo_herramienta').select('id, nombre, orden').order('orden').order('nombre').retry(false),
      client
        .from('herramienta')
        .select(
          'id, titulo, descripcion, contenido, imagen_path, video_url, created_at, herramienta_tipoherramienta(tipo_id)',
        )
        .eq('activo', true)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(MAX_RESOURCES)
        .retry(false),
    ]);
    if (categories.error || resources.error) {
      throw new Error('No se pudieron obtener los recursos.');
    }
    return parseCatalog({ categories: categories.data, resources: resources.data });
  },
};

/** URL pública de la imagen de un recurso, o null si no hay ruta segura o falta la configuración. */
export function publicImageUrl(path: string | null): string | null {
  return buildPublicImageUrl(process.env.EXPO_PUBLIC_SUPABASE_URL, path);
}
