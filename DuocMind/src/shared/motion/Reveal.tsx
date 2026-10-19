import React, { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';
import {
  motionDistance,
  motionDuration,
  motionEasing,
  NATIVE_DRIVER,
} from './motionTokens';
import { useReducedMotion } from './useReducedMotion';

interface RevealProps {
  children: React.ReactNode;
  /** Posición en la secuencia; cada paso retrasa la entrada 70 ms. */
  index?: number;
  style?: StyleProp<ViewStyle>;
}

/** Entrada suave de tarjetas y listas: fundido con un leve ascenso de 12 px. */
export function Reveal({ children, index = 0, style }: RevealProps) {
  const reduceMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: motionDuration.reveal,
      delay: index * motionDuration.stagger,
      easing: motionEasing.calm,
      useNativeDriver: NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [index, progress, reduceMotion]);

  return (
    <Animated.View
      style={[
        style,
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
