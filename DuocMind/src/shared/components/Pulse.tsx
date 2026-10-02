import React, { useEffect, useRef } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { useReduceMotion } from './useReduceMotion';

interface PulseProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/* Latido suave y continuo para indicadores, como el punto de notificaciones */
export function Pulse({ children, style }: PulseProps) {
  const reduceMotion = useReduceMotion();
  const beat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return undefined;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(beat, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(beat, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [beat, reduceMotion]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: beat.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] }),
          transform: [{ scale: beat.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
