import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Se recuerda la última lectura para que las pantallas siguientes no parpadeen
// mientras se consulta de nuevo la preferencia del sistema.
let lastKnown = false;

/**
 * Indica si la persona pidió reducir el movimiento (Android: "Quitar animaciones";
 * web: prefers-reduced-motion). Cuando es true, nada debe animarse.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(lastKnown);

  useEffect(() => {
    let active = true;
    const update = (value: boolean) => {
      lastKnown = value;
      if (active) setReduced(value);
    };
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(update)
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', update);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
