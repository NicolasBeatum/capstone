import { StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '@/shared/components/Glass';
import { BookmarkIcon, ClockIcon, PinIcon } from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import {
  eventDateKey,
  eventDateParts,
  eventIntervalLabel,
  eventTime,
  type InstitutionalEvent,
} from '@/shared/events/domain/institutionalEvent';
import { fontFamily as font } from '@/shared/theme/typography';
import { eventTypeStyle } from '@/shared/events/components/eventTypeStyle';

interface EventListCardProps {
  event: InstitutionalEvent;
  saved: boolean;
  /** Falso cuando el evento ya terminó o se canceló y no hay nada que guardar. */
  canSave: boolean;
  busy: boolean;
  onOpen: () => void;
  onToggleSave: () => void;
}

/** Tarjeta de lista: la fecha manda, el tipo da el color y el marcador guarda con un toque. */
export function EventListCard({ event, saved, canSave, busy, onOpen, onToggleSave }: EventListCardProps) {
  const palette = eventTypeStyle(event.type);
  const parts = eventDateParts(event.startsAt);
  const sameDay = eventDateKey(event.startsAt) === eventDateKey(event.endsAt);
  const time = sameDay ? `${eventTime(event.startsAt)} – ${eventTime(event.endsAt)}` : eventIntervalLabel(event);
  const showBookmark = saved || canSave;

  return (
    <ScalePress
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalles de ${event.title}`}
    >
      <GlassCard style={styles.card}>
        <View style={[styles.dateTile, { backgroundColor: palette.soft }]}>
          <Text style={[styles.tileWeekday, { color: palette.strong }]}>{parts.weekday}</Text>
          <Text style={[styles.tileDay, { color: palette.strong }]}>{parts.day}</Text>
          <Text style={[styles.tileMonth, { color: palette.strong }]}>{parts.month}</Text>
        </View>
        <View style={styles.body}>
          <View style={styles.tagRow}>
            {event.type ? (
              <View style={[styles.typePill, { backgroundColor: palette.soft }]}>
                <Text style={[styles.typeText, { color: palette.strong }]}>{event.type.name.toUpperCase()}</Text>
              </View>
            ) : null}
            <Text style={styles.registration}>{event.requiresRegistration ? 'Con inscripción' : 'Sin inscripción'}</Text>
          </View>
          <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
          <View style={styles.metaRow}>
            <ClockIcon size={14} color="#596273" />
            <Text style={styles.meta}>{time}</Text>
          </View>
          <View style={styles.metaRow}>
            <PinIcon size={14} color="#596273" />
            <Text style={styles.meta} numberOfLines={1}>{event.location}</Text>
          </View>
        </View>
        {showBookmark ? (
          <ScalePress
            style={[styles.bookmark, saved && styles.bookmarkSaved, busy && styles.disabled]}
            onPress={onToggleSave}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={saved ? `Quitar ${event.title} de mi agenda` : `Guardar ${event.title} en mi agenda`}
            accessibilityState={{ selected: saved, disabled: busy }}
          >
            <BookmarkIcon size={19} color="#1a2b44" filled={saved} />
          </ScalePress>
        ) : null}
      </GlassCard>
    </ScalePress>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 14, borderRadius: 24 },
  dateTile: { width: 68, borderRadius: 18, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  tileWeekday: { fontFamily: font.extraBold, fontSize: 11, letterSpacing: 1 },
  tileDay: { fontFamily: font.extraBold, fontSize: 30, lineHeight: 34 },
  tileMonth: { fontFamily: font.bold, fontSize: 12, letterSpacing: 1.2 },
  body: { flex: 1, gap: 5 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingRight: 44 },
  typePill: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4 },
  typeText: { fontFamily: font.extraBold, fontSize: 11, letterSpacing: 0.8 },
  registration: { color: '#596273', fontFamily: font.semiBold, fontSize: 12 },
  title: { color: '#1a2b44', fontFamily: font.extraBold, fontSize: 18, lineHeight: 23 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  meta: { flex: 1, color: '#465266', fontFamily: font.semiBold, fontSize: 13, lineHeight: 18 },
  bookmark: {
    position: 'absolute', top: 12, right: 12, width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3ecda',
    borderWidth: 1, borderColor: '#d9d1b8',
  },
  bookmarkSaved: { backgroundColor: '#f2c14e', borderColor: '#f2c14e' },
  disabled: { opacity: 0.5 },
});
