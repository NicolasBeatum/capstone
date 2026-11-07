import React, { useState } from 'react';
import { Linking, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav } from '@/shared/components/BottomNav';
import { ChevronLeftIcon } from '@/shared/components/Icons';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { ScalePress } from '@/shared/components/ScalePress';
import { Reveal } from '@/shared/motion/Reveal';
import { ResourceThumb } from '../components/ResourceThumb';
import {
  categoryIconKey,
  categoryIndex,
  categoryTone,
  findResource,
  primaryCategory,
  type ResourceCategory,
  type ResourceCatalog,
  type WellnessResource,
} from '../domain/wellnessResource';
import { useResourceCatalog } from '../hooks/useResourceCatalog';
import { styles } from './ResourceDetailScreen.styles';

const MAX_IMAGE_SIZE = 360;
const SIDE_PADDING = 44;

/** Detalle de un recurso: imagen, texto, categorías, video externo y aviso de orientación general. */
export default function ResourceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { result, refresh, imageUrl } = useResourceCatalog();
  const [videoError, setVideoError] = useState<string | null>(null);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/wellness'));
  const catalog: ResourceCatalog | null = result?.status === 'ready' ? result.catalog : null;
  const resource = catalog ? findResource(catalog, id) : null;

  const openVideo = (url: string) => {
    setVideoError(null);
    // Solo enlaces https y sin enviar ningún dato de la persona.
    if (!/^https:\/\//i.test(url)) {
      setVideoError('No se pudo abrir el video.');
      return;
    }
    Linking.openURL(url).catch(() => {
      setVideoError('No se pudo abrir el video. Revisa tu conexión e inténtalo de nuevo.');
    });
  };

  const header = (
    <ScalePress
      style={styles.backButton}
      onPress={goBack}
      accessibilityRole="button"
      accessibilityLabel="Volver a Bienestar"
    >
      <ChevronLeftIcon size={22} />
    </ScalePress>
  );

  let body: React.ReactNode;

  if (result === null) {
    body = (
      <View style={styles.stateBox}>
        <GotaLoader size="sm" text="Cargando recurso…" />
      </View>
    );
  } else if (result.status === 'error') {
    body = (
      <View style={styles.stateBox} accessibilityLiveRegion="polite">
        <Text style={styles.stateTitle}>No pudimos cargar el recurso</Text>
        <Text style={styles.stateText}>Revisa tu conexión e inténtalo de nuevo.</Text>
        <ScalePress
          style={styles.stateButton}
          onPress={() => void refresh()}
          accessibilityRole="button"
          accessibilityLabel="Reintentar cargar el recurso"
        >
          <Text style={styles.stateButtonText}>Reintentar</Text>
        </ScalePress>
      </View>
    );
  } else if (!catalog || !resource) {
    body = (
      <View style={styles.stateBox} accessibilityLiveRegion="polite">
        <Text style={styles.stateTitle}>Este recurso ya no está disponible</Text>
        <Text style={styles.stateText}>Puede que Bienestar lo haya retirado.</Text>
        <ScalePress
          style={styles.stateButton}
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Volver a Bienestar"
        >
          <Text style={styles.stateButtonText}>Volver a Bienestar</Text>
        </ScalePress>
      </View>
    );
  } else {
    body = (
      <ResourceBody
        resource={resource}
        catalog={catalog}
        imageSize={Math.min(width - SIDE_PADDING, MAX_IMAGE_SIZE)}
        imageUrl={imageUrl(resource.imagePath)}
        videoError={videoError}
        onOpenVideo={openVideo}
        onOpenHelp={() => router.push('/wellness/crisis-resources')}
      />
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: Math.max(24, insets.top + 12) }]}
        showsVerticalScrollIndicator={false}
      >
        {header}
        {body}
      </ScrollView>
      <BottomNav currentTab="wellness" />
    </View>
  );
}

interface ResourceBodyProps {
  resource: WellnessResource;
  catalog: ResourceCatalog;
  imageSize: number;
  imageUrl: string | null;
  videoError: string | null;
  onOpenVideo: (url: string) => void;
  onOpenHelp: () => void;
}

function ResourceBody({
  resource,
  catalog,
  imageSize,
  imageUrl,
  videoError,
  onOpenVideo,
  onOpenHelp,
}: ResourceBodyProps) {
  const main = primaryCategory(catalog, resource);
  const categories = resource.categoryIds
    .map((categoryId) => catalog.categories.find((category) => category.id === categoryId))
    .filter((category): category is ResourceCategory => category !== undefined);

  return (
    <>
      <Reveal>
        <View style={styles.imageWrap}>
          <ResourceThumb
            imageUrl={imageUrl}
            tone={categoryTone(categoryIndex(catalog, main?.id ?? null))}
            iconKey={main ? categoryIconKey(main.name) : 'generic'}
            label={resource.title}
            size={imageSize}
            radius={26}
          />
        </View>
      </Reveal>

      <Reveal index={1}>
        {categories.length > 0 ? (
          <View style={styles.pills}>
            {categories.map((category) => {
              const tone = categoryTone(categoryIndex(catalog, category.id));
              return (
                <View key={category.id} style={[styles.pill, { backgroundColor: tone.background }]}>
                  <Text style={[styles.pillText, { color: tone.foreground }]}>{category.name}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
        <Text style={styles.title} accessibilityRole="header">
          {resource.title}
        </Text>
        {resource.description ? <Text style={styles.description}>{resource.description}</Text> : null}
        {resource.content ? <Text style={styles.body}>{resource.content}</Text> : null}
      </Reveal>

      {resource.videoUrl ? (
        <Reveal index={2}>
          <ScalePress
            style={styles.videoButton}
            onPress={() => onOpenVideo(resource.videoUrl as string)}
            accessibilityRole="button"
            accessibilityLabel="Ver video, se abre en tu navegador"
          >
            <Text style={styles.videoText}>Ver video</Text>
          </ScalePress>
          <Text style={styles.videoCaption}>Se abre en un sitio externo, en tu navegador, y necesita conexión.</Text>
          {videoError ? (
            <Text style={styles.videoError} accessibilityLiveRegion="polite">
              {videoError}
            </Text>
          ) : null}
        </Reveal>
      ) : null}

      <Reveal index={3}>
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Son orientación general y no reemplazan la atención de un profesional.
          </Text>
          <ScalePress
            style={styles.helpLink}
            onPress={onOpenHelp}
            accessibilityRole="button"
            accessibilityLabel="¿Necesitas hablar con alguien? Ver líneas de ayuda"
          >
            <Text style={styles.helpLinkText}>¿Necesitas hablar con alguien? Ver líneas de ayuda</Text>
          </ScalePress>
        </View>
      </Reveal>
    </>
  );
}
