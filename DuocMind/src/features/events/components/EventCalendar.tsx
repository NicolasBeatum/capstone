import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { GlassCard } from '@/shared/components/Glass';
import { ScalePress } from '@/shared/components/ScalePress';
import { eventOccupiesDate, monthCells, shiftMonth, type InstitutionalEvent } from '@/shared/events/domain/institutionalEvent';
import { styles } from '../screens/events.styles';
export function EventCalendar({ month, selected, events, onMonth, onSelect }: {
  month: string; selected: string; events: InstitutionalEvent[]; onMonth(month: string): void; onSelect(date: string): void;
}) {
  const { width } = useWindowDimensions();
  const title = new Date(`${month}-15T12:00:00Z`).toLocaleDateString('es-CL', { timeZone: 'UTC', month: 'long', year: 'numeric' });
  return <GlassCard style={styles.month}>
    <View style={styles.monthHeader}>
      <ScalePress style={[styles.button, styles.secondary]} onPress={() => onMonth(shiftMonth(month, -1))} accessibilityRole="button" accessibilityLabel="Mes anterior"><Text style={styles.secondaryText}>‹</Text></ScalePress>
      <Text style={[styles.label, { flexShrink: 1, textAlign: 'center' }]}>{title}</Text>
      <ScalePress style={[styles.button, styles.secondary]} onPress={() => onMonth(shiftMonth(month, 1))} accessibilityRole="button" accessibilityLabel="Mes siguiente"><Text style={styles.secondaryText}>›</Text></ScalePress>
    </View>
    <ScrollView horizontal contentContainerStyle={{ width: Math.max(308, width - 64) }}><View style={[styles.grid, { width: '100%' }]}>
      {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((label, i) => <View key={`header-${i}`} style={styles.cell}><Text style={styles.subtitle}>{label}</Text></View>)}
      {monthCells(month).map((date, i) => {
        if (!date) return <View key={`blank-${i}`} style={styles.cell} />;
        const hasEvents = events.some(event => eventOccupiesDate(event, date)), chosen = date === selected;
        return <View key={date} style={styles.cell}><ScalePress style={[styles.day, chosen && styles.selectedDay]} onPress={() => onSelect(date)}
          accessibilityRole="button" accessibilityLabel={`${date}${hasEvents ? ', con eventos' : ', sin eventos'}`} accessibilityState={{ selected: chosen }}>
          <Text style={[styles.dayText, chosen && styles.selectedDayText]}>{Number(date.slice(8))}</Text>
          {hasEvents && <View style={[styles.dot, chosen && { backgroundColor: '#f3e7a0' }]} />}
        </ScalePress></View>;
      })}
    </View></ScrollView>
  </GlassCard>;
}
