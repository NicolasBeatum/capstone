import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import {
  motionDistance,
  motionDuration,
  motionEasing,
  NATIVE_DRIVER,
} from './motionTokens';
import { useReducedMotion } from './useReducedMotion';

interface FocusSource {
  addListener: (type: 'focus', callback: () => void) => () => void;
}

interface ScreenTransitionProps {
  children: React.ReactNode;
  /** Navegación de la pantalla; repite la entrada cuando vuelve a quedar al frente. */
  navigation?: FocusSource;
}

/** Entrada de pantalla: fundido de 500 ms con un ascenso de 12 px, sin rebote. */
export function ScreenTransition({ children, navigation }: ScreenTransitionProps) {
  const reduceMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const running = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const play = () => {
      running.current?.stop();
      if (reduceMotion) {
        progress.setValue(1);
        return;
      }
      progress.setValue(0);
      running.current = Animated.timing(progress, {
        toValue: 1,
        duration: motionDuration.screen,
        easing: motionEasing.calm,
        useNativeDriver: NATIVE_DRIVER,
      });
      running.current.start();
    };

    play();
    // El primer 'focus' coincide con el montaje, que ya animó.
    let first = true;
    const unsubscribe = navigation?.addListener('focus', () => {
      if (first) {
        first = false;
        return;
      }
      play();
    });
    return () => {
      unsubscribe?.();
      running.current?.stop();
    };
  }, [navigation, progress, reduceMotion]);

  return (
    <Animated.View
      style={[
        styles.fill,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [motionDistance.rise, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
