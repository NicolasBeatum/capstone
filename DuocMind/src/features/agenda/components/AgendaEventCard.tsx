import { StyleSheet, Text, View } from 'react-native';
import { ClockIcon, CloseIcon, PinIcon } from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import type { useEvents } from '@/shared/events/application/useEvents';
import { eventTypeStyle } from '@/shared/events/components/eventTypeStyle';
import { EventInterestActions } from '@/shared/events/components/EventInterestActions';
import { EVENT_STATE_LABELS, registrationInfo } from '@/shared/events/domain/institutionalEvent';
import { fontFamily as font } from '@/shared/theme/typography';
import type { AgendaItem } from '../application/agendaItems';

type EventItem = Extract<AgendaItem, { kind: 'event' }>;

interface AgendaEventCardProps {
  item: EventItem;
  now: Date;
  model: ReturnType<typeof useEvents>;
  onOpen: () => void;
}

/** Evento guardado: tocar la tarjeta abre el detalle y la X la quita de la agenda. */
export function AgendaEventCard({ item, now, model, onOpen }: AgendaEventCardProps) {
  const { event, interest, current, changed, unavailable } = item.projection;
  const palette = eventTypeStyle(event.type);
  const registration = registrationInfo(current ?? event, now);
  const needsAttention = changed || unavailable;
  const stateLabel = item.state === 'upcoming' ? null : EVENT_STATE_LABELS[item.state];

  return (
    <ScalePress
      style={styles.card}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalles de ${event.title}`}
    >
      <View style={[styles.bar, { backgroundColor: palette.dot }]} />
      <View style={styles.body}>
        <View style={styles.tags}>
          {event.type ? <View style={[styles.pill, { backgroundColor: palette.soft }]}><Text style={[styles.pillText, { color: palette.strong }]}>{event.type.name}</Text></View> : null}
          {stateLabel ? <View style={[styles.pill, item.state === 'cancelled' ? styles.pillDanger : styles.pillNow]}><Text style={[styles.pillText, item.state === 'cancelled' ? styles.pillDangerText : styles.pillNowText]}>{stateLabel}</Text></View> : null}
        </View>
        <Text style={styles.title}>{event.title}</Text>
        {item.continuation ? <Text style={styles.note}>Continúa desde un día anterior</Text> : null}
        <View style={styles.metaRow}><ClockIcon size={14} color="#596273" /><Text style={styles.meta}>{item.interval}</Text></View>
        <View style={styles.metaRow}><PinIcon size={14} color="#596273" /><Text style={styles.meta}>{event.location}</Text></View>
        <Text style={styles.registration}>{registration.label}</Text>
        {registration.reason ? <Text style={styles.note}>{registration.reason}</Text> : null}
        {needsAttention
          ? <EventInterestActions event={event} interest={interest} current={current} model={model} showAgenda={false} />
          : null}
      </View>
      <ScalePress
        style={[styles.close, model.busy && styles.disabled]}
        disabled={model.busy}
        onPress={() => void model.remove(event.id)}
        accessibilityRole="button"
        accessibilityLabel={`Quitar ${event.title} de mi agenda`}
      >
        <CloseIcon size={14} color="#a39b8b" />
      </ScalePress>
    </ScalePress>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, backgroundColor: '#fffaf0', borderRadius: 20, borderWidth: 1, borderColor: '#e6dfc9', paddingVertical: 14, paddingLeft: 14, paddingRight: 14 },
  bar: { alignSelf: 'stretch', width: 4, borderRadius: 2 },
  // La X ocupa la esquina; las etiquetas y el título dejan espacio para que no se pisen.
  body: { flex: 1, gap: 6, paddingRight: 34 },
  tags: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  pill: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
  pillText: { fontSize: 12, fontFamily: font.extraBold },
  pillNow: { backgroundColor: '#d6f0e5' }, pillNowText: { color: '#087a55' },
  pillDanger: { backgroundColor: '#f6dad6' }, pillDangerText: { color: '#9b3d33' },
  registration: { color: '#596273', fontSize: 12, fontFamily: font.semiBold },
  title: { color: '#1a2b44', fontSize: 17, lineHeight: 22, fontFamily: font.extraBold },
  note: { color: '#665125', fontSize: 13, lineHeight: 19, fontFamily: font.bold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  meta: { flex: 1, color: '#465266', fontSize: 13, lineHeight: 18, fontFamily: font.semiBold },
  // Solo el trazo, sin fondo: el área táctil sigue siendo de 36 px.
  close: { position: 'absolute', top: 6, right: 6, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
});
