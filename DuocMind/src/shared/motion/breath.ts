import { useEffect } from 'react';
import { Animated } from 'react-native';
import { motionDuration, motionEasing, NATIVE_DRIVER } from './motionTokens';
import { useReducedMotion } from './useReducedMotion';

/**
 * Ciclo de respiración compartido: 0 = exhalado, 1 = inhalado. Una sola animación
 * de 10 s (4 s inhalar, 6 s exhalar) sirve a todos los fondos montados, así el
 * ritmo no se reinicia al cambiar de pantalla.
 */
const breath = new Animated.Value(0);
let subscribers = 0;
let loop: Animated.CompositeAnimation | null = null;

function start() {
  loop = Animated.loop(
    Animated.sequence([
      Animated.timing(breath, {
        toValue: 1,
        duration: motionDuration.inhale,
        easing: motionEasing.breath,
        useNativeDriver: NATIVE_DRIVER,
      }),
      Animated.timing(breath, {
        toValue: 0,
        duration: motionDuration.exhale,
        easing: motionEasing.breath,
        useNativeDriver: NATIVE_DRIVER,
      }),
    ]),
  );
  loop.start();
}

/** Devuelve el valor de respiración, o null si hay que reducir el movimiento. */
export function useBreath(): Animated.Value | null {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    subscribers += 1;
    if (subscribers === 1) start();
    return () => {
      subscribers -= 1;
      if (subscribers === 0) {
        loop?.stop();
        loop = null;
      }
    };
  }, [reduceMotion]);

  return reduceMotion ? null : breath;
}
