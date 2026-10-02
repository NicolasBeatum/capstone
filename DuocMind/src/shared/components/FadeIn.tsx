import React, { useEffect, useRef } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { useReduceMotion } from './useReduceMotion';

interface FadeInProps {
  children: React.ReactNode;
  /* Espera antes de empezar; sirve para escalonar varias secciones */
  delay?: number;
  duration?: number;
  /* Distancia en px desde la que llega el contenido */
  offset?: number;
  /* 'y' sube desde abajo; 'x' entra desde la derecha (útil entre pasos de un flujo) */
  axis?: 'x' | 'y';
  style?: StyleProp<ViewStyle>;
}

/* Entrada suave: el contenido aparece desplazándose unos píxeles (inspirado en
 * AnimatedContent de React Bits, implementado con Animated nativo). */
export function FadeIn({
  children,
  delay = 0,
  duration = 520,
  offset = 18,
  axis = 'y',
  style,
}: FadeInProps) {
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return undefined;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [delay, duration, progress, reduceMotion]);

  const shift = progress.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] });

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [axis === 'x' ? { translateX: shift } : { translateY: shift }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
