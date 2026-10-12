import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav } from '@/shared/components/BottomNav';
import { GlassCard, LiquidBackground } from '@/shared/components/Glass';
import { ScalePress } from '@/shared/components/ScalePress';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { Reveal } from '@/shared/motion/Reveal';
import { useEvents } from '@/shared/events/application/useEvents';
import { EventInterestActions } from '@/shared/events/components/EventInterestActions';
import { EVENT_STATE_LABELS, eventDateLabel, eventIntervalLabel, eventTime, getEventState, registrationInfo, UUID_PATTERN } from '@/shared/events/domain/institutionalEvent';
import { styles } from './events.styles';
export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(), model = useEvents(), router = useRouter(), insets = useSafeAreaInsets();
  const validId = typeof id === 'string' && UUID_PATTERN.test(id) ? id.toLowerCase() : '';
  const current = model.snapshot?.document.catalog?.events.find(event => event.id === validId);
  const interest = model.snapshot?.document.interests.find(item => item.event.id === validId);
  const event = current ?? interest?.event;
  const registration = event ? registrationInfo(event, model.now) : null;
  return <View style={styles.root}><LiquidBackground />
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(24, insets.top + 12) }]}>
      <ScalePress style={[styles.button, styles.secondary, { alignSelf: 'flex-start' }]} onPress={() => router.canGoBack() ? router.back() : router.replace('/events')} accessibilityRole="button"><Text style={styles.secondaryText}>‹ Volver a eventos</Text></ScalePress>
      {model.loading ? <GotaLoader text="Cargando evento…" /> : event ? <>
        <Text style={styles.eyebrow}>EVENTO INSTITUCIONAL</Text><Text style={styles.title}>{event.title}</Text>
        <View style={styles.status}><Text style={styles.statusText}>{EVENT_STATE_LABELS[getEventState(event, model.now)]}</Text></View>
        <Reveal><GlassCard style={styles.card}><Text style={styles.label}>Cuándo</Text><Text style={styles.body}>{eventIntervalLabel(event)}</Text><Text style={styles.subtitle}>Hora de Santiago, Chile</Text><Text style={styles.label}>Ubicación</Text><Text style={styles.body}>{event.location}</Text></GlassCard></Reveal>
        <Reveal><GlassCard style={styles.card}><Text style={styles.label}>Sobre el evento</Text><Text style={styles.body}>{event.description || 'Sin descripción disponible.'}</Text></GlassCard></Reveal>
        <Reveal><GlassCard style={styles.card}><Text style={styles.cardTitle}>{registration?.label}</Text>{registration?.reason ? <Text style={styles.body}>{registration.reason}</Text> : null}{event.registrationDeadline && <Text style={styles.body}>Plazo: {eventDateLabel(event.registrationDeadline)} · {eventTime(event.registrationDeadline)}</Text>}
          <EventInterestActions event={event} current={current} interest={interest} model={model} />
        </GlassCard></Reveal>
      </> : <GlassCard style={styles.empty}><Text style={styles.cardTitle}>Evento no disponible</Text><Text style={styles.body}>No encontramos un evento publicado con ese identificador.</Text></GlassCard>}
      {model.snapshot?.warning && <Text style={styles.subtitle} accessibilityLiveRegion="polite">{model.snapshot.warning}</Text>}
      {model.message && <Text style={styles.success} accessibilityLiveRegion="polite">{model.message}</Text>}
      {model.error && <Text style={styles.error} accessibilityRole="alert">{model.error}</Text>}
    </ScrollView><BottomNav currentTab="wellness" />
  </View>;
}
