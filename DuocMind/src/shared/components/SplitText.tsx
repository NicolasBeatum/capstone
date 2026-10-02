import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useReduceMotion } from './useReduceMotion';

interface SplitTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  /* Espera antes de que aparezca la primera palabra */
  delay?: number;
  /* Tiempo entre una palabra y la siguiente */
  stagger?: number;
  align?: 'left' | 'center';
}

function splitMargins(style: StyleProp<TextStyle>): {
  wordStyle: TextStyle;
  containerMargins: ViewStyle;
} {
  const {
    margin,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    marginHorizontal,
    marginVertical,
    ...wordStyle
  } = StyleSheet.flatten(style) ?? {};
  return {
    wordStyle,
    containerMargins: {
      margin,
      marginTop,
      marginBottom,
      marginLeft,
      marginRight,
      marginHorizontal,
      marginVertical,
    },
  };
}

/* Revela el texto palabra por palabra (inspirado en SplitText/BlurText de
 * React Bits). Usa un valor animado por palabra; el texto no debe cambiar
 * durante la vida del componente, así que conviene usar `key={text}`. */
export function SplitText({ text, style, delay = 0, stagger = 80, align = 'left' }: SplitTextProps) {
  const reduceMotion = useReduceMotion();
  const words = useMemo(() => text.split(' '), [text]);
  const progress = useRef(words.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.forEach((value) => value.setValue(1));
      return undefined;
    }
    const animation = Animated.sequence([
      Animated.delay(delay),
      Animated.stagger(
        stagger,
        progress.map((value) =>
          Animated.timing(value, {
            toValue: 1,
            duration: 480,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ),
      ),
    ]);
    animation.start();
    return () => animation.stop();
  }, [delay, progress, reduceMotion, stagger]);

  /* Los márgenes del estilo van al contenedor; aplicados a cada palabra se
   * repetirían en cada línea cuando el texto se parte en varias */
  const { wordStyle, containerMargins } = useMemo(() => splitMargins(style), [style]);

  return (
    <View
      style={[styles.row, align === 'center' && styles.rowCentered, containerMargins]}
      accessible
      accessibilityRole="header"
      accessibilityLabel={text}
    >
      {words.map((word, index) => (
        <Animated.Text
          key={`${word}-${index}`}
          style={[
            wordStyle,
            {
              opacity: progress[index],
              transform: [
                { translateY: progress[index].interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
              ],
            },
          ]}
        >
          {index < words.length - 1 ? `${word} ` : word}
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  rowCentered: { justifyContent: 'center' },
});
