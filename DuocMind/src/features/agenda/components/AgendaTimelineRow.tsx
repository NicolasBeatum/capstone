import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fontFamily as font } from '@/shared/theme/typography';

interface AgendaTimelineRowProps {
  /** Hora de inicio y, si cabe, de término; sin ellas (todo el día) se usa `start` como texto. */
  start: string;
  end?: string;
  dotColor: string;
  /** La última fila no prolonga la línea hacia abajo. */
  isLast: boolean;
  children: ReactNode;
}

/** Una fila de la línea de tiempo del día: hora a la izquierda, línea con punto y la tarjeta. */
export function AgendaTimelineRow({ start, end, dotColor, isLast, children }: AgendaTimelineRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.time}>
        <Text style={styles.start}>{start}</Text>
        {end ? <Text style={styles.end}>{end}</Text> : null}
      </View>
      <View style={styles.rail} importantForAccessibility="no-hide-descendants">
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        {isLast ? null : <View style={styles.line} />}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch', gap: 10 },
  time: { width: 46, paddingTop: 14, alignItems: 'flex-end' },
  start: { color: '#1a2b44', fontSize: 14, fontFamily: font.extraBold },
  end: { color: '#8a8272', fontSize: 12, fontFamily: font.semiBold, marginTop: 2 },
  rail: { width: 14, alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 18, borderWidth: 2, borderColor: '#f3ecda' },
  line: { flex: 1, width: 2, marginTop: 4, borderRadius: 1, backgroundColor: 'rgba(26,43,68,0.14)' },
  content: { flex: 1, paddingBottom: 12 },
});
