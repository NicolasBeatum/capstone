import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav } from '@/shared/components/BottomNav';
import { GlassCard, LiquidBackground } from '@/shared/components/Glass';
import { ScalePress } from '@/shared/components/ScalePress';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { Reveal } from '@/shared/motion/Reveal';
import { useEvents } from '@/shared/events/application/useEvents';
import { EVENT_STATE_LABELS, eventDateKey, eventDateLabel, eventIntervalLabel, eventOccupiesDate, getEventState, isDateKey, registrationInfo } from '@/shared/events/domain/institutionalEvent';
import { EventCalendar } from '../components/EventCalendar';
import { styles } from './events.styles';
type Filter = 'upcoming' | 'date' | 'past';
export default function EventsScreen() {
  const model = useEvents(), router = useRouter(), insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ date?: string }>();
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [selected, setSelected] = useState(() => isDateKey(params.date) ? params.date : eventDateKey(new Date()));
  const [month, setMonth] = useState(selected.slice(0, 7));
  const events = model.snapshot?.document.catalog?.events ?? [];
  const interests = model.snapshot?.document.interests ?? [];
  const visible = events.filter(event => filter === 'date' ? eventOccupiesDate(event, selected) : filter === 'past' ? Date.parse(event.endsAt) <= model.now.getTime() : Date.parse(event.endsAt) > model.now.getTime());
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/wellness');
  return <View style={styles.root}><LiquidBackground />
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(24, insets.top + 12) }]}>
      <Reveal><View style={styles.header}>
        <ScalePress style={[styles.button, styles.secondary]} onPress={goBack} accessibilityRole="button"><Text style={styles.secondaryText}>‹ Volver</Text></ScalePress>
        <ScalePress style={[styles.button, styles.secondary]} onPress={() => router.push('/agenda')} accessibilityRole="button"><Text style={styles.secondaryText}>Mi agenda</Text></ScalePress>
      </View><Text style={[styles.eyebrow, { marginTop: 18 }]}>ACTIVIDADES Y ENCUENTROS</Text><Text style={styles.title}>Eventos</Text><Text style={styles.subtitle}>Descubre actividades y guarda las que te interesan.{ '\n' }Fechas y horas de Santiago, Chile.</Text></Reveal>
      <View style={styles.controls}>{([['upcoming', 'Próximos'], ['date', 'Por fecha'], ['past', 'Anteriores']] as const).map(([id, label]) =>
        <ScalePress key={id} style={[styles.button, styles.secondary, styles.filter, filter === id && styles.activeFilter]} onPress={() => setFilter(id)} accessibilityRole="button" accessibilityState={{ selected: filter === id }}><Text style={filter === id ? styles.buttonText : styles.secondaryText}>{label}</Text></ScalePress>)}</View>
      {filter === 'date' && <><EventCalendar month={month} selected={selected} events={events} onMonth={setMonth} onSelect={date => { setSelected(date); router.setParams({ date }); }} /><Text style={styles.label}>{eventDateLabel(`${selected}T12:00:00Z`)}</Text></>}
      <View style={styles.header}><Text style={[styles.subtitle, { flex: 1 }]}>{model.snapshot?.offline ? 'Última copia disponible' : 'Catálogo institucional'}{model.snapshot?.document.downloadedAt ? ` · ${new Date(model.snapshot.document.downloadedAt).toLocaleString('es-CL', { timeZone: 'America/Santiago' })}` : ''}</Text><ScalePress style={[styles.button, styles.secondary]} onPress={() => void model.refresh()} accessibilityRole="button"><Text style={styles.secondaryText}>Actualizar</Text></ScalePress></View>
      {model.snapshot?.warning && <Text style={styles.subtitle} accessibilityLiveRegion="polite">{model.snapshot.warning}</Text>}
      {model.error && <Text style={styles.error} accessibilityRole="alert">{model.error}</Text>}
      {model.loading ? <GotaLoader text="Cargando eventos…" /> : visible.length ? visible.map((event, i) => {
        const registration = registrationInfo(event, model.now), saved = interests.some(interest => interest.event.id === event.id);
        return <Reveal key={event.id} index={i}><GlassCard style={styles.card}>
          <View style={styles.header}><View style={styles.status}><Text style={styles.statusText}>{EVENT_STATE_LABELS[getEventState(event, model.now)]}</Text></View>{saved && <Text style={styles.success}>✓ En mi agenda</Text>}</View>
          <Text style={styles.cardTitle}>{event.title}</Text><Text style={styles.body}>{eventIntervalLabel(event)}</Text><Text style={styles.label}>Ubicación · {event.location}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>{event.description || 'Sin descripción disponible.'}</Text><Text style={styles.label}>{registration.label}</Text>{registration.reason ? <Text style={styles.subtitle}>{registration.reason}</Text> : null}
          <ScalePress style={[styles.button, styles.secondary]} onPress={() => router.push({ pathname: '/events/[id]', params: { id: event.id } })} accessibilityRole="button" accessibilityLabel={`Ver detalles de ${event.title}`}><Text style={styles.secondaryText}>Ver evento →</Text></ScalePress>
        </GlassCard></Reveal>;
      }) : !model.error && <GlassCard style={styles.empty}><Text style={styles.cardTitle}>{filter === 'date' ? 'No hay eventos para esta fecha' : 'No hay eventos disponibles'}</Text><Text style={styles.body}>{model.snapshot?.document.catalog ? 'Puedes consultar otra fecha o actualizar el catálogo.' : 'Conéctate para consultar las actividades institucionales.'}</Text></GlassCard>}
    </ScrollView><BottomNav currentTab="wellness" />
  </View>;
}
