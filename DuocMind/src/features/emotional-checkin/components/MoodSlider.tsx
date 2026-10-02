import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { clampMood, MOOD_MAX, MOOD_SCALE, moodFromValue } from '../domain/moodFace';
import { fontFamily as font } from '@/shared/theme/typography';

interface MoodSliderProps {
  /* Valor animado compartido con el rostro; el deslizador lo escribe */
  value: Animated.Value;
  /* Color del tramo recorrido: sigue al color del rostro */
  color: string;
  /* Valor actual para accesibilidad y etiquetas */
  level: number;
  onChangeStart?: () => void;
}

const THUMB = 34;
const TRACK_HEIGHT = 12;

/* Deslizador de cinco pasos: se arrastra con libertad y al soltar se acomoda
 * en el estado más cercano. Un toque sobre la barra también salta a ese punto. */
export function MoodSlider({ value, color, level, onChangeStart }: MoodSliderProps) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const startValue = useRef(0);

  const snapTo = (target: number) => {
    Animated.spring(value, {
      toValue: clampMood(target),
      speed: 18,
      bounciness: 9,
      useNativeDriver: false,
    }).start();
  };

  const valueAt = (x: number) => {
    const usable = Math.max(1, widthRef.current - THUMB);
    return clampMood(((x - THUMB / 2) / usable) * MOOD_MAX);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          value.stopAnimation();
          onChangeStart?.();
          startValue.current = valueAt(event.nativeEvent.locationX);
          value.setValue(startValue.current);
        },
        onPanResponderMove: (_event, gesture) => {
          const usable = Math.max(1, widthRef.current - THUMB);
          value.setValue(clampMood(startValue.current + (gesture.dx / usable) * MOOD_MAX));
        },
        onPanResponderRelease: () => {
          value.stopAnimation((current) => snapTo(Math.round(current)));
        },
      }),
    // `value` y los callbacks son estables durante la vida del componente
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onLayout = (event: LayoutChangeEvent) => {
    widthRef.current = event.nativeEvent.layout.width;
    setWidth(event.nativeEvent.layout.width);
  };

  const usable = Math.max(1, width - THUMB);
  const thumbX = value.interpolate({
    inputRange: [0, MOOD_MAX],
    outputRange: [0, usable],
    extrapolate: 'clamp',
  });
  const fillWidth = value.interpolate({
    inputRange: [0, MOOD_MAX],
    outputRange: [THUMB / 2, width - THUMB / 2],
    extrapolate: 'clamp',
  });

  const step = (delta: number) => {
    onChangeStart?.();
    snapTo(Math.round(level) + delta);
  };

  return (
    <View>
      <View
        style={styles.touchArea}
        onLayout={onLayout}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Cómo te sientes hoy"
        accessibilityValue={{ text: moodFromValue(level) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'increment') step(1);
          if (event.nativeEvent.actionName === 'decrement') step(-1);
        }}
        {...panResponder.panHandlers}
      >
        <View style={styles.track} pointerEvents="none" />
        <Animated.View
          style={[styles.fill, { width: fillWidth, backgroundColor: color }]}
          pointerEvents="none"
        />
        {MOOD_SCALE.map((mood, index) => (
          <View
            key={mood}
            pointerEvents="none"
            style={[
              styles.notch,
              { left: THUMB / 2 + (usable * index) / MOOD_MAX - 3 },
            ]}
          />
        ))}
        <Animated.View
          pointerEvents="none"
          style={[styles.thumb, { transform: [{ translateX: thumbX }] }]}
        >
          <View style={[styles.thumbCore, { backgroundColor: color }]} />
        </Animated.View>
      </View>

      <View style={styles.endLabels}>
        <Text style={styles.endLabel}>{MOOD_SCALE[0]}</Text>
        <Text style={styles.endLabel}>{MOOD_SCALE[MOOD_MAX]}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  touchArea: {
    height: 52,
    justifyContent: 'center',
  },
  track: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: 'rgba(26, 43, 68, 0.10)',
    marginHorizontal: THUMB / 2 - TRACK_HEIGHT / 2,
  },
  fill: {
    position: 'absolute',
    left: 0,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    opacity: 0.9,
  },
  notch: {
    position: 'absolute',
    top: 52 / 2 - 3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  thumb: {
    position: 'absolute',
    left: 0,
    top: (52 - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1a2b44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
  thumbCore: {
    width: THUMB - 14,
    height: THUMB - 14,
    borderRadius: (THUMB - 14) / 2,
  },
  endLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  endLabel: {
    fontSize: 11,
    color: '#8a8272',
    fontFamily: font.semiBold,
  },
});
