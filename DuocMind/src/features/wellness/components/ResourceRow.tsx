import React from 'react';
import { Text, View } from 'react-native';
import { ChevronRightIcon } from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import {
  categoryIconKey,
  categoryIndex,
  categoryTone,
  primaryCategory,
  type ResourceCatalog,
  type WellnessResource,
} from '../domain/wellnessResource';
import { resourceColors, resourceStyles as styles } from './resourceStyles';
import { ResourceThumb } from './ResourceThumb';

interface ResourceRowProps {
  resource: WellnessResource;
  catalog: ResourceCatalog;
  imageUrl: string | null;
  onPress: () => void;
}

const THUMB_SIZE = 56;

/** Fila de la lista: miniatura, título, descripción breve (si la hay) e indicador de video. */
export function ResourceRow({ resource, catalog, imageUrl, onPress }: ResourceRowProps) {
  const category = primaryCategory(catalog, resource);
  const tone = categoryTone(categoryIndex(catalog, category?.id ?? null));
  const iconKey = category ? categoryIconKey(category.name) : 'generic';
  const hasVideo = resource.videoUrl !== null;

  const details = [category?.name, hasVideo ? 'Incluye video' : null].filter(Boolean).join('. ');

  return (
    <ScalePress
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={details ? `${resource.title}. ${details}` : resource.title}
      accessibilityHint="Abre el detalle del recurso"
    >
      <ResourceThumb imageUrl={imageUrl} tone={tone} iconKey={iconKey} label={resource.title} size={THUMB_SIZE} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {resource.title}
        </Text>
        {resource.description ? (
          <Text style={styles.rowDescription} numberOfLines={2}>
            {resource.description}
          </Text>
        ) : null}
        {hasVideo ? <Text style={styles.rowVideo}>Video</Text> : null}
      </View>
      <ChevronRightIcon size={20} color={resourceColors.muted} />
    </ScalePress>
  );
}
