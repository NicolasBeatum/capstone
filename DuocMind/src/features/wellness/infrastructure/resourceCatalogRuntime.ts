import { loadResourceCatalog } from '../application/resourceCatalog';
import { createResourceCatalogStore } from './resourceCatalogStore';
import { resourceCache } from './resourceCacheStorage';
import { supabaseResourceGateway } from './supabaseResourceGateway';

/** Instancia única: la lista de Bienestar y el detalle comparten el mismo catálogo en memoria. */
export const resourceCatalogStore = createResourceCatalogStore({
  load: () =>
    loadResourceCatalog({
      gateway: supabaseResourceGateway,
      cache: resourceCache,
      now: () => new Date(),
    }),
  now: () => Date.now(),
});
