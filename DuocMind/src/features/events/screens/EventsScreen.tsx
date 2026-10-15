import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav } from '@/shared/components/BottomNav';
import { GlassCard, LiquidBackground } from '@/shared/components/Glass';
import { ScalePress } from '@/shared/components/ScalePress';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { CalendarIcon, ChevronLeftIcon } from '@/shared/components/Icons';
import { Reveal } from '@/shared/motion/Reveal';
import { useEvents } from '@/shared/events/application/useEvents';
import { canAddEvent, eventDateKey, eventDateLabel, eventOccupiesDate, isDateKey, type EventType, type InstitutionalEvent } from '@/shared/events/domain/institutionalEvent';
import { fontFamily as font } from '@/shared/theme/typography';
import { EventCalendar } from '../components/EventCalendar';
import { EventListCard } from '../components/EventListCard';
import { eventTypeStyle } from '@/shared/events/components/eventTypeStyle';
import { FeaturedEventCard } from '../components/FeaturedEventCard';
import { styles } from './events.styles';
type Filter = 'upcoming' | 'date' | 'past';
const FILTERS = [['upcoming', 'Próximos'], ['date', 'Por fecha'], ['past', 'Anteriores']] as const;
const TYPE_ORDER = ['charla', 'taller', 'actividad'];

/* Tipos presentes en el catálogo, en el orden habitual y luego alfabético. */
function typesIn(events: InstitutionalEvent[]): EventType[] {
  const byCode = new Map<string, EventType>();
  for (const event of events) if (event.type) byCode.set(event.type.code, event.type);
  const rank = (type: EventType) => { const i = TYPE_ORDER.indexOf(type.code); return i === -1 ? TYPE_ORDER.length : i; };
  return [...byCode.values()].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'es'));
}

export default function EventsScreen() {
  const model = useEvents(), router = useRouter(), insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ date?: string }>();
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [typeCode, setTypeCode] = useState<string | null>(null);
  const [selected, setSelected] = useState(() => isDateKey(params.date) ? params.date : eventDateKey(new Date()));
  const [month, setMonth] = useState(selected.slice(0, 7));
  const events = model.snapshot?.document.catalog?.events ?? [];
  const interests = model.snapshot?.document.interests ?? [];
  const types = typesIn(events);
  const activeType = types.some(type => type.code === typeCode) ? typeCode : null;
  const byTab = events.filter(event => filter === 'date' ? eventOccupiesDate(event, selected) : filter === 'past' ? Date.parse(event.endsAt) <= model.now.getTime() : Date.parse(event.endsAt) > model.now.getTime());
  const byType = byTab.filter(event => activeType === null || event.type?.code === activeType);
  // Los anteriores se listan del más reciente al más antiguo.
  const visible = filter === 'past' ? [...byType].reverse() : byType;
  const featured = filter === 'upcoming' ? visible[0] : undefined;
  const rest = featured ? visible.slice(1) : visible;
  const isSaved = (event: InstitutionalEvent) => interests.some(interest => interest.event.id === event.id);
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/wellness');
  const open = (event: InstitutionalEvent) => router.push({ pathname: '/events/[id]', params: { id: event.id } });
  const sectionTitle = filter === 'past' ? 'Anteriores' : filter === 'date' ? eventDateLabel(`${selected}T12:00:00Z`) : 'Más adelante';
  return <View style={styles.root}><LiquidBackground />
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(24, insets.top + 12) }]}>
      <Reveal><View style={styles.header}>
        <ScalePress style={local.roundButton} onPress={goBack} accessibilityRole="button" accessibilityLabel="Volver"><ChevronLeftIcon size={22} /></ScalePress>
        <ScalePress style={local.agendaButton} onPress={() => router.push('/agenda')} accessibilityRole="button" accessibilityLabel={`Mi agenda, ${interests.length} evento${interests.length === 1 ? '' : 's'} guardado${interests.length === 1 ? '' : 's'}`}>
          <CalendarIcon size={19} /><Text style={styles.secondaryText}>Mi agenda</Text>
          {interests.length > 0 && <View style={local.count}><Text style={local.countText}>{interests.length}</Text></View>}
        </ScalePress>
      </View><Text style={[styles.eyebrow, { marginTop: 18 }]}>BIENESTAR</Text><Text style={styles.title}>Eventos</Text><Text style={styles.subtitle}>Guarda los que te interesen en tu agenda.{'\n'}Fechas y horas de Santiago, Chile.</Text></Reveal>
      <View style={local.segmented}>{FILTERS.map(([id, label]) =>
        <ScalePress key={id} style={[local.segment, filter === id && local.segmentActive]} onPress={() => setFilter(id)} accessibilityRole="button" accessibilityState={{ selected: filter === id }}><Text style={[local.segmentText, filter === id && local.segmentTextActive]}>{label}</Text></ScalePress>)}</View>
      {types.length > 0 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={local.chips}>
        <ScalePress style={[local.chip, activeType === null && local.chipActive]} onPress={() => setTypeCode(null)} accessibilityRole="button" accessibilityState={{ selected: activeType === null }}><Text style={local.chipText}>Todos</Text></ScalePress>
        {types.map(type => <ScalePress key={type.code} style={[local.chip, activeType === type.code && { backgroundColor: eventTypeStyle(type).soft, borderColor: eventTypeStyle(type).dot }]} onPress={() => setTypeCode(type.code)} accessibilityRole="button" accessibilityState={{ selected: activeType === type.code }}>
          <View style={[local.chipDot, { backgroundColor: eventTypeStyle(type).dot }]} /><Text style={local.chipText}>{type.name}</Text>
        </ScalePress>)}
      </ScrollView>}
      {filter === 'date' && <EventCalendar month={month} selected={selected} events={events} onMonth={setMonth} onSelect={date => { setSelected(date); router.setParams({ date }); }} />}
      <View style={styles.header}><Text style={[styles.subtitle, { flex: 1 }]}>{model.snapshot?.offline ? 'Última copia disponible' : 'Catálogo institucional'}{model.snapshot?.document.downloadedAt ? ` · ${new Date(model.snapshot.document.downloadedAt).toLocaleString('es-CL', { timeZone: 'America/Santiago' })}` : ''}</Text><ScalePress style={[styles.button, styles.secondary]} onPress={() => void model.refresh()} accessibilityRole="button"><Text style={styles.secondaryText}>Actualizar</Text></ScalePress></View>
      {model.snapshot?.warning && <Text style={styles.subtitle} accessibilityLiveRegion="polite">{model.snapshot.warning}</Text>}
      {model.error && <Text style={styles.error} accessibilityRole="alert">{model.error}</Text>}
      {model.loading ? <GotaLoader text="Cargando eventos…" /> : visible.length ? <>
        {featured && <Reveal><FeaturedEventCard event={featured} now={model.now} saved={isSaved(featured)} onOpen={() => open(featured)} /></Reveal>}
        {rest.length > 0 && <View style={styles.header}><Text style={local.sectionTitle}>{sectionTitle}</Text><Text style={styles.subtitle}>{rest.length} evento{rest.length === 1 ? '' : 's'}</Text></View>}
        {rest.map((event, i) => <Reveal key={event.id} index={i}><EventListCard event={event} saved={isSaved(event)} canSave={canAddEvent(event, model.now)} busy={model.busy} onOpen={() => open(event)}
          onToggleSave={() => void (isSaved(event) ? model.remove(event.id) : model.add(event))} /></Reveal>)}
      </> : !model.error && <GlassCard style={styles.empty}><Text style={styles.cardTitle}>{filter === 'date' ? 'No hay eventos para esta fecha' : activeType ? 'No hay eventos de este tipo' : 'No hay eventos disponibles'}</Text><Text style={styles.body}>{model.snapshot?.document.catalog ? 'Puedes consultar otra fecha, otro tipo o actualizar el catálogo.' : 'Conéctate para consultar las actividades institucionales.'}</Text></GlassCard>}
      {model.message && <Text style={styles.success} accessibilityLiveRegion="polite">{model.message}</Text>}
    </ScrollView><BottomNav currentTab="wellness" />
  </View>;
}
const local = StyleSheet.create({
  roundButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fffaf0', borderWidth: 1, borderColor: '#e6dfc9' },
  agendaButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, borderRadius: 22, backgroundColor: '#fffaf0', borderWidth: 1, borderColor: '#e6dfc9' },
  count: { position: 'absolute', top: -6, right: -4, minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2c14e' },
  countText: { color: '#1a2b44', fontFamily: font.extraBold, fontSize: 12 },
  segmented: { flexDirection: 'row', padding: 4, borderRadius: 22, backgroundColor: 'rgba(236,229,210,0.85)' },
  segment: { flex: 1, minHeight: 44, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: '#1a2b44' },
  segmentText: { color: '#465266', fontFamily: font.bold, fontSize: 14 },
  segmentTextActive: { color: '#fff' },
  chips: { gap: 8, paddingVertical: 2 },
  chip: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, borderRadius: 22, backgroundColor: '#fffaf0', borderWidth: 1, borderColor: '#e6dfc9' },
  chipActive: { backgroundColor: '#ddd5f4', borderColor: '#a99bde' },
  chipDot: { width: 10, height: 10, borderRadius: 5 },
  chipText: { color: '#1a2b44', fontFamily: font.bold, fontSize: 14 },
  sectionTitle: { color: '#1a2b44', fontFamily: font.extraBold, fontSize: 20 },
});
