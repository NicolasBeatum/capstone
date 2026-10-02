import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, type StyleProp, type TextStyle } from 'react-native';
import { useReduceMotion } from './useReduceMotion';

interface CountUpProps {
  to: number;
  duration?: number;
  delay?: number;
  style?: StyleProp<TextStyle>;
}

/* Contador que sube de 0 hasta `to` (inspirado en CountUp de React Bits).
 * Actualiza estado en cada cuadro, así que conviene usarlo solo con números pequeños. */
export function CountUp({ to, duration = 900, delay = 0, style }: CountUpProps) {
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const [value, setValue] = useState(reduceMotion ? to : 0);

  useEffect(() => {
    const id = progress.addListener(({ value: current }) => setValue(Math.round(current)));
    return () => progress.removeListener(id);
  }, [progress]);

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(to);
      return undefined;
    }
    const animation = Animated.timing(progress, {
      toValue: to,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [delay, duration, progress, reduceMotion, to]);

  return <Text style={style}>{value}</Text>;
}
