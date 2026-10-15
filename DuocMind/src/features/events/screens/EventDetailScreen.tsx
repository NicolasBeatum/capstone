import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav } from '@/shared/components/BottomNav';
import { GlassCard, LiquidBackground, LiquidPanel } from '@/shared/components/Glass';
import { ScalePress } from '@/shared/components/ScalePress';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { BookmarkIcon, CalendarIcon, CheckIcon, ChevronLeftIcon, ClockIcon, PinIcon } from '@/shared/components/Icons';
import { Reveal } from '@/shared/motion/Reveal';
import { useEvents } from '@/shared/events/application/useEvents';
import { EventInterestActions } from '@/shared/events/components/EventInterestActions';
import { canAddEvent, eventCountdownLabel, eventDateLabel, eventDateKey, eventIntervalLabel, eventTime, registrationInfo, UUID_PATTERN } from '@/shared/events/domain/institutionalEvent';
import { fontFamily as font } from '@/shared/theme/typography';
import { eventTypeStyle } from '@/shared/events/components/eventTypeStyle';
import { styles } from './events.styles';
export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(), model = useEvents(), router = useRouter(), insets = useSafeAreaInsets();
  const validId = typeof id === 'string' && UUID_PATTERN.test(id) ? id.toLowerCase() : '';
  const current = model.snapshot?.document.catalog?.events.find(event => event.id === validId);
  const interest = model.snapshot?.document.interests.find(item => item.event.id === validId);
  const event = current ?? interest?.event;
  const registration = event ? registrationInfo(event, model.now) : null;
  const palette = eventTypeStyle(event?.type ?? null);
  const saved = !!interest;
  const sameDay = !!event && eventDateKey(event.startsAt) === eventDateKey(event.endsAt);
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/events');
  return <View style={styles.root}><LiquidBackground />
    <ScrollView contentContainerStyle={[local.content, { paddingBottom: 120 }]}>
      {model.loading ? <View style={{ paddingTop: Math.max(24, insets.top + 12), paddingHorizontal: 20 }}><GotaLoader text="Cargando evento…" /></View> : event ? <>
        <Reveal><LiquidPanel from={palette.gradientFrom} to={palette.gradientTo} radius={0} style={[local.hero, { paddingTop: Math.max(24, insets.top + 12) }]}>
          <View style={local.heroTop}>
            <ScalePress style={local.heroButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Volver a eventos"><ChevronLeftIcon size={22} color="#fff" /></ScalePress>
            {(saved || canAddEvent(event, model.now)) && <ScalePress style={[local.heroButton, saved && local.heroButtonSaved, model.busy && styles.muted]} disabled={model.busy}
              onPress={() => void (saved ? model.remove(event.id) : model.add(event))} accessibilityRole="button"
              accessibilityLabel={saved ? `Quitar ${event.title} de mi agenda` : `Guardar ${event.title} en mi agenda`} accessibilityState={{ selected: saved, disabled: model.busy }}>
              <BookmarkIcon size={21} color={saved ? '#1a2b44' : '#fff'} filled={saved} />
            </ScalePress>}
          </View>
          <View style={local.pills}>
            {event.type && <View style={local.typePill}><Text style={local.typePillText}>{event.type.name.toUpperCase()}</Text></View>}
            <View style={local.countdown}><Text style={local.countdownText}>{eventCountdownLabel(event, model.now)}</Text></View>
          </View>
          <Text style={local.heroTitle} accessibilityRole="header">{event.title}</Text>
        </LiquidPanel></Reveal>
        <View style={local.body}>
          <Reveal index={1}><GlassCard style={local.infoCard}>
            <View style={local.infoRow}><View style={[local.infoIcon, { backgroundColor: '#e3dbf7' }]}><CalendarIcon size={20} color="#4f3d99" /></View>
              <View style={local.infoText}><Text style={local.infoLabel}>FECHA</Text><Text style={local.infoValue}>{sameDay ? eventDateLabel(event.startsAt) : eventIntervalLabel(event)}</Text></View></View>
            {sameDay && <><View style={local.separator} /><View style={local.infoRow}><View style={[local.infoIcon, { backgroundColor: '#fbe9b8' }]}><ClockIcon size={20} color="#8a5a12" /></View>
              <View style={local.infoText}><Text style={local.infoLabel}>HORA · SANTIAGO DE CHILE</Text><Text style={local.infoValue}>{eventTime(event.startsAt)} – {eventTime(event.endsAt)}</Text></View></View></>}
            <View style={local.separator} /><View style={local.infoRow}><View style={[local.infoIcon, { backgroundColor: '#cdebd9' }]}><PinIcon size={20} color="#1d6148" /></View>
              <View style={local.infoText}><Text style={local.infoLabel}>LUGAR</Text><Text style={local.infoValue}>{event.location}</Text></View></View>
          </GlassCard></Reveal>
          {registration?.state === 'free' && <Reveal index={2}><View style={local.freeBanner}><View style={local.freeCheck}><CheckIcon size={18} color="#fff" /></View>
            <View style={local.infoText}><Text style={local.freeTitle}>Entrada libre</Text><Text style={local.freeSub}>{registration.label}</Text></View></View></Reveal>}
          <Reveal index={3}><Text style={local.sectionTitle}>Sobre el evento</Text><GlassCard style={[styles.card, { marginTop: 10 }]}><Text style={styles.body}>{event.description || 'Sin descripción disponible.'}</Text></GlassCard></Reveal>
          {/* Sin inscripción no hay nada que explicar: las acciones van directas, sin tarjeta. */}
          <Reveal index={4}>{registration?.state === 'free'
            ? <EventInterestActions event={event} current={current} interest={interest} model={model} />
            : <GlassCard style={styles.card}>
              <Text style={styles.cardTitle}>{registration?.label}</Text>{registration?.reason ? <Text style={styles.body}>{registration.reason}</Text> : null}{event.registrationDeadline && <Text style={styles.body}>Plazo: {eventDateLabel(event.registrationDeadline)} · {eventTime(event.registrationDeadline)}</Text>}
              <EventInterestActions event={event} current={current} interest={interest} model={model} />
            </GlassCard>}</Reveal>
        </View>
      </> : <View style={{ paddingTop: Math.max(24, insets.top + 12), paddingHorizontal: 20, gap: 16 }}>
        <ScalePress style={local.roundButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Volver a eventos"><ChevronLeftIcon size={22} /></ScalePress>
        <GlassCard style={styles.empty}><Text style={styles.cardTitle}>Evento no disponible</Text><Text style={styles.body}>No encontramos un evento publicado con ese identificador.</Text></GlassCard></View>}
      <View style={local.body}>
        {model.snapshot?.warning && <Text style={styles.subtitle} accessibilityLiveRegion="polite">{model.snapshot.warning}</Text>}
        {model.message && <Text style={styles.success} accessibilityLiveRegion="polite">{model.message}</Text>}
        {model.error && <Text style={styles.error} accessibilityRole="alert">{model.error}</Text>}
      </View>
    </ScrollView><BottomNav currentTab="wellness" />
  </View>;
}
const local = StyleSheet.create({
  content: { gap: 16 }, body: { paddingHorizontal: 20, gap: 16 },
  hero: { paddingHorizontal: 20, paddingBottom: 40, gap: 14, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)' },
  heroButtonSaved: { backgroundColor: '#f2c14e' },
  roundButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fffaf0', borderWidth: 1, borderColor: '#e6dfc9' },
  pills: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typePill: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.2)' },
  typePillText: { color: '#fff', fontFamily: font.extraBold, fontSize: 12, letterSpacing: 0.8 },
  countdown: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f2c14e' },
  countdownText: { color: '#1a2b44', fontFamily: font.extraBold, fontSize: 12, letterSpacing: 0.6 },
  heroTitle: { color: '#fff', fontFamily: font.extraBold, fontSize: 30, lineHeight: 36 },
  infoCard: { padding: 16, gap: 12, marginTop: -28, borderRadius: 24, backgroundColor: '#fffaf0' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  infoIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1, gap: 2 },
  infoLabel: { color: '#655d50', fontFamily: font.bold, fontSize: 11, letterSpacing: 1 },
  infoValue: { color: '#1a2b44', fontFamily: font.extraBold, fontSize: 17, lineHeight: 23 },
  separator: { height: 1, backgroundColor: 'rgba(26,43,68,0.1)', marginLeft: 58 },
  freeBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 20, backgroundColor: '#dcefe3', borderWidth: 1, borderColor: '#b9e0c9' },
  freeCheck: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2e9a76' },
  freeTitle: { color: '#1d6148', fontFamily: font.extraBold, fontSize: 17 },
  freeSub: { color: '#1d6148', fontFamily: font.semiBold, fontSize: 13 },
  sectionTitle: { color: '#1a2b44', fontFamily: font.extraBold, fontSize: 20 },
});
