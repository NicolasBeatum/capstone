import React, { useEffect, useState } from 'react';
import { Brote } from '@/shared/components/Brote';
import { useReducedMotion } from '@/shared/motion/useReducedMotion';

const START = 0.5; // Brote pequeño y tranquilo
const END = 1; // Brote crecido, con flor y destellos
const STEP = 0.01;
const FRAME_MS = 60; // ~3 segundos de crecimiento

/** El Brote crece poco a poco al aparecer. Con movimiento reducido se muestra ya crecido. */
export function GrowingBrote({ size = 110 }: { size?: number }) {
  const reduceMotion = useReducedMotion();
  const [t, setT] = useState(reduceMotion ? END : START);

  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => {
      setT((prev) => {
        if (prev >= END) {
          clearInterval(id);
          return END;
        }
        return Math.min(END, prev + STEP);
      });
    }, FRAME_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  return <Brote t={t} size={size} />;
}
