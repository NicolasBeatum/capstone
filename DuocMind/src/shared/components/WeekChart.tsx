import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useReduceMotion } from './useReduceMotion';

export type WeekMood = 'Muy mal' | 'Mal' | 'Neutro' | 'Bien' | 'Muy bien';

export interface WeekDayData {
  day: string;
  mood: WeekMood;
  value: number; // 0-100, altura relativa de la barra
}

/* Escala cálida alineada a la paleta de la app: terracota → arena → amarillo */
const MOOD_COLORS: Record<WeekMood, string> = {
  'Muy mal': '#b45f43',
  'Mal': '#d08053',
  'Neutro': '#dfc08b',
  'Bien': '#f0c95e',
  'Muy bien': '#e5a92e',
};

export const WEEK_MOODS: WeekMood[] = ['Muy mal', 'Mal', 'Neutro', 'Bien', 'Muy bien'];

export function moodColor(mood: WeekMood): string {
  return MOOD_COLORS[mood];
}

interface WeekChartProps {
  data: WeekDayData[];
  todayIndex?: number;
}

interface BarFillProps {
  percent: number;
  color: string;
  delay: number;
}

/* Barra que crece desde la base, una tras otra (efecto cascada).
 * Anima `height`, que no admite driver nativo; son solo siete barras. */
function BarFill({ percent, color, delay }: BarFillProps) {
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(percent);
      return undefined;
    }
    const animation = Animated.timing(progress, {
      toValue: percent,
      duration: 700,
      delay,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [delay, percent, progress, reduceMotion]);

  return (
    <Animated.View
      style={[
        styles.barFill,
        {
          backgroundColor: color,
          height: progress.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
            extrapolate: 'clamp',
          }),
        },
      ]}
    />
  );
}

export function WeekChart({ data, todayIndex }: WeekChartProps) {
  return (
    <View>
      <View style={styles.barsRow}>
        {data.map((item, index) => {
          const isToday = todayIndex === index;
          const percent = Math.min(100, Math.max(8, item.value));
          return (
            <View key={item.day} style={styles.barColumn}>
              {isToday && <View style={styles.todayDot} />}
              <View style={[styles.barTrack, isToday && styles.barTrackToday]}>
                <BarFill percent={percent} color={MOOD_COLORS[item.mood]} delay={450 + index * 80} />
              </View>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{item.day}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legendRow}>
        {WEEK_MOODS.map((mood) => (
          <View key={mood} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: MOOD_COLORS[mood] }]} />
            <Text style={styles.legendLabel}>{mood}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#1a2b44',
    marginBottom: 4,
  },
  barTrack: {
    width: '100%',
    height: 96,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(26, 43, 68, 0.06)',
    borderRadius: 9,
  },
  barTrackToday: {
    borderWidth: 1,
    borderColor: 'rgba(26, 43, 68, 0.35)',
  },
  barFill: {
    width: '100%',
    borderRadius: 9,
  },
  dayLabel: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: '#8a8272',
  },
  dayLabelToday: {
    color: '#1a2b44',
    fontWeight: '800',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8a8272',
  },
});
