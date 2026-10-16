import React, { useEffect, useRef } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { Brote } from '@/shared/components/Brote';
import { motionDistance, motionDuration, NATIVE_DRIVER } from '@/shared/motion/motionTokens';
import { useReducedMotion } from '@/shared/motion/useReducedMotion';

interface DancingBroteProps {
  /** Ánimo del Brote de 0 (Muy mal) a 1 (Muy bien). */
  t: number;
  /** Ancho en px; el alto sigue la proporción del dibujo. */
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const SAMPLES = 24;
/** Un ciclo completo: un paso a cada lado. */
const CYCLE_DURATION = motionDuration.danceStepSlow * 2;

/**
 * El driver nativo solo interpola linealmente, así que el vaivén se muestrea en muchos
 * puntos: la inclinación sigue un seno y la altura su cuadrado. Como el ciclo empieza y
 * termina en reposo, el bucle no da saltos al reiniciar.
 */
function buildDanceRanges() {
  const input: number[] = [];
  const tilt: string[] = [];
  const lift: number[] = [];
  for (let i = 0; i <= SAMPLES; i += 1) {
    const progress = i / SAMPLES;
    const wave = Math.sin(progress * 2 * Math.PI);
    input.push(progress);
    tilt.push(`${wave * motionDistance.danceTilt}deg`);
    lift.push(-wave * wave * motionDistance.danceLift);
  }
  return { input, tilt, lift };
}

const DANCE = buildDanceRanges();

/**
 * El Brote bailando en su sitio, pivotando en la base del macetero, con un vaivén lento
 * para acompañar sin distraer. Quieto con movimiento reducido.
 */
export function DancingBrote({ t, size = 90, style }: DancingBroteProps) {
  const reduceMotion = useReducedMotion();
  const dance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      dance.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(dance, {
        toValue: 1,
        duration: CYCLE_DURATION,
        easing: Easing.linear,
        useNativeDriver: NATIVE_DRIVER,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [dance, reduceMotion]);

  const danceStyle = reduceMotion
    ? null
    : {
        transformOrigin: '50% 100%',
        transform: [
          { translateY: dance.interpolate({ inputRange: DANCE.input, outputRange: DANCE.lift }) },
          { rotate: dance.interpolate({ inputRange: DANCE.input, outputRange: DANCE.tilt }) },
        ],
      };

  return (
    <Animated.View style={[style, danceStyle]} pointerEvents="none">
      <Brote t={t} size={size} />
    </Animated.View>
  );
}
