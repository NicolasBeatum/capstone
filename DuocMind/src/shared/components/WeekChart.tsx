import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { motionDuration, motionEasing, NATIVE_DRIVER } from '@/shared/motion/motionTokens';
import { useReducedMotion } from '@/shared/motion/useReducedMotion';

export type WeekMood = 'Muy mal' | 'Mal' | 'Neutro' | 'Bien' | 'Muy bien';

export interface WeekDayData {
  /** Inicial del día bajo la barra. */
  day: string;
  /** Nombre completo del día, para lectores de pantalla. */
  dayName: string;
  /** null cuando el día no tiene registro. */
  mood: WeekMood | null;
  /** 0-100, altura relativa de la barra; null cuando el día no tiene registro. */
  value: number | null;
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

const TRACK_HEIGHT = 96;

export function moodColor(mood: WeekMood): string {
  return MOOD_COLORS[mood];
}

interface BarProps {
  mood: WeekMood | null;
  value: number | null;
  index: number;
  isToday: boolean;
  reduceMotion: boolean;
}

/**
 * La barra ocupa toda la pista y se desliza hacia arriba con el driver nativo:
 * la animación no depende del hilo de JS y los bordes redondeados no se deforman.
 */
function Bar({ mood, value, index, isToday, reduceMotion }: BarProps) {
  const target = value === null ? 0 : Math.min(1, Math.max(0, value / 100));
  const fill = useRef(new Animated.Value(0)).current;
  const shown = useRef(0);
  // Al vaciarse, la barra baja con su último color en vez de cambiar de golpe.
  const color = useRef(MOOD_COLORS.Neutro);
  if (mood) color.current = MOOD_COLORS[mood];

  useEffect(() => {
    if (reduceMotion) {
      fill.setValue(target);
      shown.current = target;
      return undefined;
    }
    // Las barras que aparecen desde vacío entran escalonadas; un cambio puntual no espera.
    const delay = shown.current === 0 ? index * motionDuration.stagger : 0;
    shown.current = target;
    const animation = Animated.timing(fill, {
      toValue: target,
      duration: motionDuration.chartBar,
      delay,
      easing: motionEasing.calm,
      useNativeDriver: NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [fill, index, reduceMotion, target]);

  const translateY = useMemo(
    () => fill.interpolate({ inputRange: [0, 1], outputRange: [TRACK_HEIGHT, 0] }),
    [fill],
  );

  return (
    <View style={[styles.barTrack, isToday && styles.barTrackToday]}>
      <Animated.View
        style={[styles.barFill, { backgroundColor: color.current, transform: [{ translateY }] }]}
      />
    </View>
  );
}

interface WeekChartProps {
  data: WeekDayData[];
  todayIndex?: number;
}

export function WeekChart({ data, todayIndex }: WeekChartProps) {
  const reduceMotion = useReducedMotion();

  return (
    <View>
      <View style={styles.barsRow}>
        {data.map((item, index) => {
          const isToday = todayIndex === index;
          return (
            <View
              key={item.day}
              style={styles.barColumn}
              accessible
              accessibilityLabel={`${item.dayName}${isToday ? ', hoy' : ''}: ${item.mood ?? 'sin registro'}`}
            >
              <View style={[styles.todayDot, !isToday && styles.todayDotHidden]} />
              <Bar
                mood={item.mood}
                value={item.value}
                index={index}
                isToday={isToday}
                reduceMotion={reduceMotion}
              />
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
  // Ocupa su espacio en todos los días para que las barras queden alineadas.
  todayDotHidden: {
    opacity: 0,
  },
  barTrack: {
    width: '100%',
    height: TRACK_HEIGHT,
    backgroundColor: 'rgba(26, 43, 68, 0.06)',
    borderRadius: 9,
    overflow: 'hidden',
  },
  barTrackToday: {
    borderWidth: 1,
    borderColor: 'rgba(26, 43, 68, 0.35)',
  },
  barFill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
