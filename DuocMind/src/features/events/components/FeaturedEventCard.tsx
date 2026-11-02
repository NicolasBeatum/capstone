import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LiquidPanel } from '@/shared/components/Glass';
import { CheckIcon, ClockIcon, PinIcon } from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import {
  eventCountdownLabel,
  eventDateKey,
  eventDateParts,
  eventIntervalLabel,
  eventTime,
  type InstitutionalEvent,
} from '@/shared/events/domain/institutionalEvent';
import { fontFamily as font } from '@/shared/theme/typography';
import { eventTypeStyle } from '@/shared/events/components/eventTypeStyle';

interface FeaturedEventCardProps {
  event: InstitutionalEvent;
  now: Date;
  saved: boolean;
  onOpen: () => void;
}

/** El próximo evento, en grande: cuenta regresiva y acceso directo al detalle. */
export function FeaturedEventCard({ event, now, saved, onOpen }: FeaturedEventCardProps) {
  const palette = eventTypeStyle(event.type);
  const parts = eventDateParts(event.startsAt);
  const sameDay = eventDateKey(event.startsAt) === eventDateKey(event.endsAt);
  const time = sameDay ? `${eventTime(event.startsAt)} – ${eventTime(event.endsAt)}` : eventIntervalLabel(event);

  return (
    <LiquidPanel from={palette.gradientFrom} to={palette.gradientTo} radius={28} style={styles.panel}>
      {/* Ondas decorativas: no comunican nada, por eso quedan fuera de accesibilidad.
          Las props de accesibilidad van en el View: en web, Svg las pasa tal cual al DOM. */}
      <View style={styles.waves} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width={220} height={220}>
          <Circle cx={150} cy={70} r={34} fill="rgba(255,255,255,0.08)" />
          <Circle cx={150} cy={70} r={62} stroke="rgba(255,255,255,0.12)" strokeWidth={1} fill="none" />
          <Circle cx={150} cy={70} r={92} stroke="rgba(255,255,255,0.08)" strokeWidth={1} fill="none" />
        </Svg>
      </View>
      <View style={styles.topRow}>
        <View style={styles.countdown}>
          <Text style={styles.countdownText}>{eventCountdownLabel(event, now)}</Text>
        </View>
        {saved ? (
          <View style={styles.savedPill}>
            <CheckIcon size={14} color="#fff" />
            <Text style={styles.savedText}>En mi agenda</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.mainRow}>
        <View style={styles.dateBlock}>
          <Text style={styles.weekday}>{parts.weekday}</Text>
          <Text style={styles.day}>{parts.day}</Text>
          <Text style={styles.month}>{parts.month}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={3}>{event.title}</Text>
          <View style={styles.metaRow}>
            <ClockIcon size={15} color="#fff" />
            <Text style={styles.meta}>{time}</Text>
          </View>
          <View style={styles.metaRow}>
            <PinIcon size={15} color="#fff" />
            <Text style={styles.meta} numberOfLines={2}>{event.location}</Text>
          </View>
        </View>
      </View>

      <ScalePress
        style={styles.button}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Ver evento ${event.title}`}
      >
        <Text style={styles.buttonText}>Ver evento →</Text>
      </ScalePress>
    </LiquidPanel>
  );
}

const styles = StyleSheet.create({
  panel: { borderRadius: 28, overflow: 'hidden', padding: 18, gap: 16 },
  waves: { position: 'absolute', top: 0, right: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  countdown: { backgroundColor: '#f2c14e', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  countdownText: { color: '#1a2b44', fontFamily: font.extraBold, fontSize: 12, letterSpacing: 0.6 },
  savedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 6,
  },
  savedText: { color: '#fff', fontFamily: font.bold, fontSize: 12 },
  mainRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dateBlock: { alignItems: 'center', minWidth: 64 },
  weekday: { color: '#f2c14e', fontFamily: font.extraBold, fontSize: 12, letterSpacing: 1.2 },
  day: { color: '#fff', fontFamily: font.extraBold, fontSize: 52, lineHeight: 58 },
  month: { color: '#fff', fontFamily: font.bold, fontSize: 14, letterSpacing: 1.6 },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.25)' },
  textBlock: { flex: 1, gap: 6 },
  title: { color: '#fff', fontFamily: font.extraBold, fontSize: 22, lineHeight: 28 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { flex: 1, color: '#fff', fontFamily: font.semiBold, fontSize: 14, lineHeight: 19 },
  button: {
    minHeight: 48, borderRadius: 24, backgroundColor: '#fffaf0',
    alignItems: 'center', justifyContent: 'center',
  },
  buttonText: { color: '#1a2b44', fontFamily: font.extraBold, fontSize: 15 },
});
