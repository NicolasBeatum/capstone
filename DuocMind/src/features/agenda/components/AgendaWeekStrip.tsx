import { StyleSheet, Text, View } from 'react-native';
import { ScalePress } from '@/shared/components/ScalePress';
import { fontFamily as font } from '@/shared/theme/typography';

export interface WeekStripDay {
  key: string;
  weekday: string;
  number: number;
  /** Tiene actividades o eventos guardados ese día. */
  busy: boolean;
}

interface AgendaWeekStripProps {
  title: string;
  days: WeekStripDay[];
  selectedKey: string;
  todayKey: string;
  onSelect: (key: string) => void;
  onPrevious: () => void;
  onNext: () => void;
}

/** Semana en una sola franja: el día elegido en azul marino y un punto en los días con algo agendado. */
export function AgendaWeekStrip({ title, days, selectedKey, todayKey, onSelect, onPrevious, onNext }: AgendaWeekStripProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <ScalePress style={styles.arrow} onPress={onPrevious} accessibilityRole="button" accessibilityLabel="Semana anterior">
          <Text style={styles.arrowText}>‹</Text>
        </ScalePress>
        <Text style={styles.title} accessibilityRole="header">{title}</Text>
        <ScalePress style={styles.arrow} onPress={onNext} accessibilityRole="button" accessibilityLabel="Semana siguiente">
          <Text style={styles.arrowText}>›</Text>
        </ScalePress>
      </View>
      <View style={styles.row}>
        {days.map((day) => {
          const selected = day.key === selectedKey;
          const isToday = day.key === todayKey;
          const past = day.key < todayKey;
          return (
            <ScalePress
              key={day.key}
              style={[styles.day, selected && styles.daySelected]}
              onPress={() => onSelect(day.key)}
              accessibilityRole="button"
              accessibilityLabel={`${day.weekday} ${day.number}${isToday ? ', hoy' : ''}${day.busy ? ', con actividades' : ''}`}
              accessibilityState={{ selected }}
            >
              <Text style={[styles.weekday, selected && styles.weekdaySelected, past && !selected && styles.muted]}>{day.weekday}</Text>
              <Text style={[styles.number, selected && styles.numberSelected, past && !selected && styles.muted]}>{day.number}</Text>
              <View style={[styles.dot, day.busy && (selected ? styles.dotSelected : styles.dotBusy), !day.busy && isToday && !selected && styles.dotToday]} />
            </ScalePress>
          );
        })}
      </View>
    </View>
  );
}

const NAVY = '#1a2b44';
const styles = StyleSheet.create({
  card: { backgroundColor: '#fffaf0', borderRadius: 26, borderWidth: 1, borderColor: '#e6dfc9', padding: 10, gap: 6 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  arrowText: { color: NAVY, fontSize: 26, lineHeight: 30, fontFamily: font.bold },
  title: { color: NAVY, fontSize: 15, fontFamily: font.extraBold },
  row: { flexDirection: 'row', gap: 4 },
  day: { flex: 1, minHeight: 74, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 2 },
  daySelected: { backgroundColor: NAVY },
  weekday: { color: '#8a8272', fontSize: 11, fontFamily: font.bold, letterSpacing: 0.6 },
  weekdaySelected: { color: '#f9dd85' },
  number: { color: NAVY, fontSize: 20, fontFamily: font.extraBold },
  numberSelected: { color: '#fff' },
  muted: { opacity: 0.45 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'transparent', marginTop: 2 },
  dotBusy: { backgroundColor: '#e0a526' },
  dotSelected: { backgroundColor: '#f2c14e' },
  dotToday: { backgroundColor: 'rgba(26,43,68,0.25)' },
});
