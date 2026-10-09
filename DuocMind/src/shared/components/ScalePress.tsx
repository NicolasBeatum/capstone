import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  motionDistance,
  motionDuration,
  motionEasing,
  NATIVE_DRIVER,
} from '@/shared/motion/motionTokens';
import { useReducedMotion } from '@/shared/motion/useReducedMotion';

interface ScalePressProps extends Omit<PressableProps, 'children' | 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/* Botón con micro-feedback: la superficie se comprime a 0.96 al presionar y
 * regresa con una curva suave, sin rebote. Sin movimiento si se pidió reducirlo. */
export function ScalePress({ children, style, ...rest }: ScalePressProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReducedMotion();

  const animateTo = (value: number, duration: number) => {
    if (reduceMotion) return;
    Animated.timing(scale, {
      toValue: value,
      duration,
      easing: motionEasing.soft,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

  return (
    <AnimatedPressable
      {...rest}
      style={[style, { transform: [{ scale }] }]}
      onPressIn={(event) => {
        animateTo(motionDistance.pressScale, motionDuration.pressIn);
        rest.onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateTo(1, motionDuration.pressOut);
        rest.onPressOut?.(event);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
