import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';
import { resourceCatalogStore } from '../infrastructure/resourceCatalogRuntime';
import { publicImageUrl } from '../infrastructure/supabaseResourceGateway';

/**
 * Catálogo de recursos de Bienestar. Con `refreshOnFocus` (la lista) intenta actualizarlo cada vez
 * que la pantalla se enfoca, respetando el intervalo mínimo. Sin esa opción (el detalle) usa lo que
 * ya haya en memoria y solo descarga si todavía no hay ningún resultado.
 */
export function useResourceCatalog(options: { refreshOnFocus?: boolean } = {}) {
  const { refreshOnFocus = false } = options;
  const state = useSyncExternalStore(
    resourceCatalogStore.subscribe,
    resourceCatalogStore.getSnapshot,
    resourceCatalogStore.getSnapshot,
  );

  useFocusEffect(
    useCallback(() => {
      if (refreshOnFocus) void resourceCatalogStore.refresh();
    }, [refreshOnFocus]),
  );

  useEffect(() => {
    if (!refreshOnFocus && resourceCatalogStore.getSnapshot().result === null) {
      void resourceCatalogStore.refresh();
    }
  }, [refreshOnFocus]);

  /** Reintento manual: ignora el intervalo mínimo. */
  const refresh = useCallback(() => resourceCatalogStore.refresh({ force: true }), []);

  return {
    result: state.result,
    /** Cargando: hay una descarga en curso o todavía no hay ningún resultado. */
    loading: state.loading || state.result === null,
    refresh,
    /** URL pública de la imagen de un recurso, o null si no hay ruta segura. */
    imageUrl: publicImageUrl,
  };
}
