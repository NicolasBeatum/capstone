import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  BookIcon,
  HeartIcon,
  MeditationIcon,
  MoonIcon,
  SparkleIcon,
  StretchIcon,
  WindIcon,
} from '@/shared/components/Icons';
import type { ResourceIconKey, ResourceTone } from '../domain/wellnessResource';

export function ResourceIcon({ iconKey, color, size }: { iconKey: ResourceIconKey; color: string; size: number }) {
  switch (iconKey) {
    case 'wind':
      return <WindIcon size={size} color={color} />;
    case 'meditation':
      return <MeditationIcon size={size} color={color} />;
    case 'book':
      return <BookIcon size={size} color={color} />;
    case 'stretch':
      return <StretchIcon size={size} color={color} />;
    case 'moon':
      return <MoonIcon size={size} color={color} />;
    case 'heart':
      return <HeartIcon size={size} color={color} />;
    default:
      return <SparkleIcon size={size} color={color} />;
  }
}

interface ResourceThumbProps {
  /** URL pública de la imagen; null si no hay ruta segura. */
  imageUrl: string | null;
  tone: ResourceTone;
  iconKey: ResourceIconKey;
  /** Texto para lectores de pantalla (el título del recurso). */
  label: string;
  size: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Miniatura con marcador. El marcador (tono e icono de la categoría) queda debajo y la imagen
 * aparece encima solo cuando terminó de cargar; si no hay URL o falla (sin conexión, error), se
 * queda el marcador y la lista sigue siendo usable.
 */
export function ResourceThumb({ imageUrl, tone, iconKey, label, size, radius = 14, style }: ResourceThumbProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [imageUrl]);

  const showImage = imageUrl !== null && !failed;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: tone.background,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <ResourceIcon iconKey={iconKey} color={tone.foreground} size={Math.round(size * 0.45)} />
      {showImage ? (
        <Image
          source={{ uri: imageUrl }}
          style={[StyleSheet.absoluteFill, { opacity: loaded ? 1 : 0 }]}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
    </View>
  );
}
