import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { moodColorAt } from '@/shared/components/broteParams';
import { motionDuration, motionEasing, NATIVE_DRIVER } from '@/shared/motion/motionTokens';
import { fontFamily as font } from '@/shared/theme/typography';
import {
  MOOD_MAX,
  MOOD_SCALE,
  clampMoodValue,
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
          Animated.timing(thumbScale, {
            toValue: 1.12,
            duration: motionDuration.pressIn,
            easing: motionEasing.soft,
            useNativeDriver: NATIVE_DRIVER,
          }).start();
          onChangeRef.current(valueAt(event));
        },
        onPanResponderMove: (event) => onChangeRef.current(valueAt(event)),
        onPanResponderRelease: () => {
          Animated.timing(thumbScale, {
            toValue: 1,
            duration: motionDuration.pressOut,
            easing: motionEasing.soft,
            useNativeDriver: NATIVE_DRIVER,
          }).start();
          // Acomoda el pulgar en el estado más cercano con una transición suave.
          const from = valueRef.current;
          const to = Math.round(from);
          snap.setValue(from);
          const listener = snap.addListener(({ value: next }) => onChangeRef.current(next));
          Animated.timing(snap, {
            toValue: to,
            duration: motionDuration.snap,
            easing: motionEasing.soft,
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

  // Teclado en web: las flechas mueven entre los cinco estados.
  const handleKeyDown = (event: { key: string; preventDefault: () => void }) => {
    const deltas: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };
    if (event.key === 'Home') onChange(0);
    else if (event.key === 'End') onChange(MOOD_MAX);
    else if (event.key in deltas) step(deltas[event.key]);
    else return;
    event.preventDefault();
  };
  const keyboardProps: Record<string, unknown> =
    Platform.OS === 'web' ? { tabIndex: 0, onKeyDown: handleKeyDown } : {};

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
        accessibilityValue={{ min: 0, max: MOOD_MAX, now: Math.round(clampMoodValue(value)), text: currentMood }}
        focusable
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => step(event.nativeEvent.actionName === 'increment' ? 1 : -1)}
        {...keyboardProps}
        {...responder.panHandlers}
      >
        <View style={styles.track} pointerEvents="none">
          <Svg width="100%" height={TRACK_HEIGHT}>
            <Defs>
              <LinearGradient id="moodTrack" x1="0" y1="0" x2="1" y2="0">
                {MOOD_SCALE.map((mood, index) => (
                  <Stop key={mood} offset={index / MOOD_MAX} stopColor={moodColorAt(index / MOOD_MAX)} />
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
            { left: thumbLeft, borderColor: moodColorAt(clampMoodValue(value) / MOOD_MAX), transform: [{ scale: thumbScale }] },
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
