import React, { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type TextStyle } from 'react-native';
import { motionDuration, motionEasing, NATIVE_DRIVER } from '@/shared/motion/motionTokens';

interface MoodLabelProps {
  text: string;
  style?: StyleProp<TextStyle>;
}

/** Nombre del estado actual; al cambiar entra con un fundido suave (también con movimiento reducido). */
export function MoodLabel({ text, style }: MoodLabelProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const lastText = useRef(text);

  useEffect(() => {
    if (lastText.current === text) return;
    lastText.current = text;
    opacity.setValue(0.15);
    const animation = Animated.timing(opacity, {
      toValue: 1,
      duration: motionDuration.snap,
      easing: motionEasing.soft,
      useNativeDriver: NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [text, opacity]);

  return (
    <Animated.Text style={[style, { opacity }]} accessibilityLiveRegion="polite">
      {text}
    </Animated.Text>
  );
}
