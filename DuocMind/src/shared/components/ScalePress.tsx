import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface ScalePressProps extends Omit<PressableProps, 'children' | 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/* Botón con micro-feedback: la superficie se comprime suavemente al presionar
 * y regresa con un resorte, en lugar del cambio brusco de opacidad. */
export function ScalePress({ children, style, ...rest }: ScalePressProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 5,
    }).start();
  };

  return (
    <Pressable
      style={style}
      onPressIn={() => animateTo(0.96)}
      onPressOut={() => animateTo(1)}
      {...rest}
    >
      <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
    </Pressable>
  );
}
