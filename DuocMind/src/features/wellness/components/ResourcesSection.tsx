import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { ScalePress } from '@/shared/components/ScalePress';
import { Reveal } from '@/shared/motion/Reveal';
import { useResourceCatalog } from '../hooks/useResourceCatalog';
import {
  categoriesWithResources,
  effectiveCategoryId,
  filterResources,
  formatUpdatedAt,
} from '../domain/wellnessResource';
import { ResourceChips } from './ResourceChips';
import { ResourceRow } from './ResourceRow';
import { resourceStyles as styles } from './resourceStyles';

interface ResourcesSectionProps {
  /** Lo llama la pantalla para abrir el detalle; la sección no navega por sí sola. */
  onOpenResource: (resourceId: number) => void;
  /** Posición de la sección en la entrada escalonada de la pantalla. */
  revealIndex?: number;
}

/**
 * Sección «Recursos» de Bienestar: chips de categoría y lista. Maneja los estados de carga,
 * vacío, error y copia sin conexión. No registra ni envía qué categoría o recurso elige la persona.
 */
export function ResourcesSection({ onOpenResource, revealIndex = 0 }: ResourcesSectionProps) {
  const { result, refresh, imageUrl } = useResourceCatalog({ refreshOnFocus: true });
  const [selected, setSelected] = useState<number | null>(null);

  let body: React.ReactNode;

  if (result === null) {
    body = (
      <View style={styles.stateBox}>
        <GotaLoader size="sm" text="Cargando recursos…" />
      </View>
    );
  } else if (result.status === 'error') {
    body = (
      <View style={styles.stateBox} accessibilityLiveRegion="polite">
        <Text style={styles.stateTitle}>No pudimos cargar los recursos</Text>
        <Text style={styles.stateText}>Revisa tu conexión e inténtalo de nuevo.</Text>
        <ScalePress
          style={styles.retryButton}
          onPress={() => void refresh()}
          accessibilityRole="button"
          accessibilityLabel="Reintentar cargar los recursos"
        >
          <Text style={styles.retryText}>Reintentar</Text>
        </ScalePress>
      </View>
    );
  } else {
    const updated = formatUpdatedAt(result.fetchedAt);
    const notice =
      result.source === 'cache' ? (
        <Text style={styles.notice} accessibilityLiveRegion="polite">
          {updated
            ? `Sin conexión o sin poder actualizar. Estás viendo la copia del ${updated}; puede no estar al día.`
            : 'Sin conexión o sin poder actualizar. Estás viendo una copia que puede no estar al día.'}
        </Text>
      ) : null;

    if (result.status === 'empty') {
      body = (
        <>
          {notice}
          <View style={styles.stateBox}>
            <Text style={styles.stateText}>Pronto habrá recursos aquí.</Text>
          </View>
        </>
      );
    } else {
      const { catalog } = result;
      const categoryId = effectiveCategoryId(catalog, selected);
      const resources = filterResources(catalog, categoryId);
      body = (
        <>
          {notice}
          <ResourceChips
            categories={categoriesWithResources(catalog)}
            selectedId={categoryId}
            onSelect={setSelected}
          />
          <View style={styles.list} accessibilityLabel="Lista de recursos">
            {resources.length === 0 ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateText}>No hay recursos en esta categoría.</Text>
              </View>
            ) : (
              resources.map((resource) => (
                <ResourceRow
                  key={resource.id}
                  resource={resource}
                  catalog={catalog}
                  imageUrl={imageUrl(resource.imagePath)}
                  onPress={() => onOpenResource(resource.id)}
                />
              ))
            )}
          </View>
        </>
      );
    }
  }

  return (
    <Reveal index={revealIndex} style={styles.section}>
      <Text style={styles.title} accessibilityRole="header">
        Recursos
      </Text>
      {body}
    </Reveal>
  );
}
