import React, { useMemo } from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { describeFace } from '../domain/moodFace';

interface MoodFaceProps {
  /* Posición continua en la escala: 0 = muy mal ... 4 = muy bien */
  value: number;
  size?: number;
}

const INK = '#1a2b44';

/* Rostro cuya expresión se calcula en cada cuadro a partir de `value`,
 * por lo que cambia de forma continua mientras la persona desliza. */
export function MoodFace({ value, size = 190 }: MoodFaceProps) {
  const face = useMemo(() => describeFace(value), [value]);

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={46} fill={face.fill} stroke={INK} strokeWidth={2.4} />

      {/* Rubor */}
      <Circle cx={24} cy={60} r={7} fill="#f0928a" opacity={face.blush * 0.55} />
      <Circle cx={76} cy={60} r={7} fill="#f0928a" opacity={face.blush * 0.55} />

      {/* Cejas */}
      <Path d={face.leftBrow} stroke={INK} strokeWidth={3.2} strokeLinecap="round" fill="none" />
      <Path d={face.rightBrow} stroke={INK} strokeWidth={3.2} strokeLinecap="round" fill="none" />

      {/* Ojos */}
      <Ellipse cx={36} cy={46} rx={4.6} ry={face.eyeRadiusY} fill={INK} />
      <Ellipse cx={64} cy={46} rx={4.6} ry={face.eyeRadiusY} fill={INK} />

      {/* Lágrima bajo el ojo izquierdo */}
      <Path
        d="M 33 54 Q 29.5 61 33 64 Q 36.5 61 33 54 Z"
        fill="#7fb6e6"
        opacity={face.tear}
      />

      {/* Boca */}
      <Path d={face.mouth} stroke={INK} strokeWidth={4.2} strokeLinecap="round" fill="none" />
    </Svg>
  );
}
