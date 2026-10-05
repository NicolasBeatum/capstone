import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { fontFamily as font } from '@/shared/theme/typography';
import {
  MOOD_MAX,
  MOOD_SCALE,
  clampMoodValue,
  faceColorForValue,
  moodFromValue,
} from '../domain/moodScale';

interface MoodSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const THUMB = 34;
const TRACK_HEIGHT = 12;

/**
 * Barra de "Muy mal" a "Muy bien". Se arrastra con el dedo o el mouse, o se toca un punto;
 * al soltar se acomoda en el estado más cercano.
 */
export function MoodSlider({ value, onChange }: MoodSliderProps) {
  const trackRef = useRef<View>(null);
  const track = useRef({ left: 0, width: 0 });
  const [width, setWidth] = useState(0);
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const thumbScale = useRef(new Animated.Value(1)).current;
  const snap = useRef(new Animated.Value(0)).current;

  const measure = () => {
    trackRef.current?.measureInWindow((left, _top, measuredWidth) => {
      track.current = { left, width: measuredWidth };
    });
  };

  const valueAt = (event: GestureResponderEvent) => {
    const { left, width: trackWidth } = track.current;
    const usable = Math.max(1, trackWidth - THUMB);
    return clampMoodValue(((event.nativeEvent.pageX - left - THUMB / 2) / usable) * MOOD_MAX);
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // Mientras se arrastra, el scroll o la navegación no deben robar el gesto.
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          measure();
          snap.stopAnimation();
          Animated.spring(thumbScale, { toValue: 1.18, speed: 30, bounciness: 8, useNativeDriver: true }).start();
          onChangeRef.current(valueAt(event));
        },
        onPanResponderMove: (event) => onChangeRef.current(valueAt(event)),
        onPanResponderRelease: () => {
          Animated.spring(thumbScale, { toValue: 1, speed: 24, bounciness: 10, useNativeDriver: true }).start();
          // Acomoda el pulgar en el estado más cercano con una transición corta.
          const from = valueRef.current;
          const to = Math.round(from);
          snap.setValue(from);
          const listener = snap.addListener(({ value: next }) => onChangeRef.current(next));
          Animated.timing(snap, {
            toValue: to,
            duration: 160,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
          }).start(() => {
            snap.removeListener(listener);
            onChangeRef.current(to);
          });
        },
      }),
    [snap, thumbScale],
  );

  const step = (delta: number) => onChange(clampMoodValue(Math.round(value) + delta));
  const thumbLeft = (clampMoodValue(value) / MOOD_MAX) * Math.max(0, width - THUMB);
  const currentMood = moodFromValue(value);

  return (
    <View>
      <View
        ref={trackRef}
        style={styles.hitArea}
        onLayout={(event) => {
          setWidth(event.nativeEvent.layout.width);
          measure();
        }}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Estado de ánimo"
        accessibilityValue={{ text: currentMood }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => step(event.nativeEvent.actionName === 'increment' ? 1 : -1)}
        {...responder.panHandlers}
      >
        <View style={styles.track} pointerEvents="none">
          <Svg width="100%" height={TRACK_HEIGHT}>
            <Defs>
              <LinearGradient id="moodTrack" x1="0" y1="0" x2="1" y2="0">
                {MOOD_SCALE.map((mood, index) => (
                  <Stop key={mood} offset={index / MOOD_MAX} stopColor={faceColorForValue(index)} />
                ))}
              </LinearGradient>
            </Defs>
            <Rect width="100%" height={TRACK_HEIGHT} rx={TRACK_HEIGHT / 2} fill="url(#moodTrack)" />
          </Svg>
        </View>

        <View style={styles.ticks} pointerEvents="none">
          {MOOD_SCALE.map((mood) => (
            <View key={mood} style={styles.tick} />
          ))}
        </View>

        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
            { left: thumbLeft, borderColor: faceColorForValue(value), transform: [{ scale: thumbScale }] },
          ]}
        />
      </View>

      <View style={styles.labels}>
        <Text style={styles.label}>Muy mal</Text>
        <Text style={styles.label}>Muy bien</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    height: THUMB + 16,
    justifyContent: 'center',
  },
  track: {
    marginHorizontal: THUMB / 2 - 4,
    height: TRACK_HEIGHT,
  },
  ticks: {
    position: 'absolute',
    left: THUMB / 2,
    right: THUMB / 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tick: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(26, 43, 68, 0.35)',
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: '#ffffff',
    borderWidth: 5,
    shadowColor: '#1a2b44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  label: {
    fontSize: 12,
    color: '#8a8272',
    fontFamily: font.bold,
  },
});
