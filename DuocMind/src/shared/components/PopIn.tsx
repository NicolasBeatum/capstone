import React, { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';
import { useReduceMotion } from './useReduceMotion';

interface PopInProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/* Aparición con resorte: crece desde pequeño al montarse. Útil para marcas de
 * selección y confirmaciones. */
export function PopIn({ children, style }: PopInProps) {
  const reduceMotion = useReduceMotion();
  const scale = useRef(new Animated.Value(reduceMotion ? 1 : 0.3)).current;

  useEffect(() => {
    if (reduceMotion) {
      scale.setValue(1);
      return undefined;
    }
    const animation = Animated.spring(scale, {
      toValue: 1,
      speed: 18,
      bounciness: 12,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [reduceMotion, scale]);

  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}
