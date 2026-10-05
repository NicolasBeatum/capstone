import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { MOOD_MAX, clampMoodValue, faceColorForValue } from '../domain/moodScale';

interface MoodFaceProps {
  /** Posición continua del slider: 0 = 'Muy mal' … 4 = 'Muy bien' */
  value: number;
  size: number;
}

const INK = '#1a2b44';

/* Movimiento en reposo por estado: de un balanceo lento y caído a saltitos alegres */
const IDLE_MOTION = [
  { bob: 3, rotate: 3, duration: 2600 },
  { bob: 3, rotate: 2, duration: 2100 },
  { bob: 4, rotate: 0, duration: 1700 },
  { bob: 7, rotate: 2, duration: 1100 },
  { bob: 11, rotate: 4, duration: 560 },
];

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

/** Rasgos de la cara calculados de forma continua, para que cambie al mismo ritmo del dedo. */
function FaceDrawing({ value, size, blinking }: MoodFaceProps & { blinking: boolean }) {
  const t = clampMoodValue(value) / MOOD_MAX;
  const fill = faceColorForValue(value);

  // Cejas: el extremo interior sube cuando el ánimo baja; con ánimo alto ambas se elevan.
  const sadness = Math.max(0, 0.5 - t) * 12;
  const lift = t * 4;
  const innerY = 30 - lift - sadness;
  const outerY = 30 - lift + sadness * 0.35;

  // Boca: la curva pasa de un arco hacia abajo a una sonrisa; con ánimo alto se abre.
  const halfWidth = lerp(11, 17, t);
  const curve = lerp(-13, 18, t);
  const mouthY = lerp(69, 64, t);
  const mouthOpen = t > 0.8;
  const mouthPath = mouthOpen
    ? `M${50 - halfWidth} ${mouthY} Q50 ${mouthY + curve} ${50 + halfWidth} ${mouthY} Q50 ${mouthY + curve * 0.3} ${50 - halfWidth} ${mouthY} Z`
    : `M${50 - halfWidth} ${mouthY} Q50 ${mouthY + curve} ${50 + halfWidth} ${mouthY}`;

  const happyEyes = t > 0.85;
  const blush = Math.max(0, (t - 0.5) * 1.6);
  const tear = Math.max(0, (0.18 - t) / 0.18);

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={45} fill={fill} stroke={INK} strokeWidth={2.4} />

      <Path
        d={`M26 ${outerY} Q33 ${(outerY + innerY) / 2 - 2} 41 ${innerY}`}
        stroke={INK}
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d={`M74 ${outerY} Q67 ${(outerY + innerY) / 2 - 2} 59 ${innerY}`}
        stroke={INK}
        strokeWidth={2.6}
        fill="none"
        strokeLinecap="round"
      />

      {blinking ? (
        <Path d="M30 43 h10 M60 43 h10" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
      ) : happyEyes ? (
        <Path
          d="M29 45 Q35 37 41 45 M59 45 Q65 37 71 45"
          stroke={INK}
          strokeWidth={2.8}
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <>
          <Circle cx={35} cy={43} r={4.4} fill={INK} />
          <Circle cx={65} cy={43} r={4.4} fill={INK} />
          <Circle cx={36.4} cy={41.6} r={1.3} fill="#ffffff" />
          <Circle cx={66.4} cy={41.6} r={1.3} fill="#ffffff" />
        </>
      )}

      {blush > 0 ? (
        <>
          <Circle cx={25} cy={57} r={6.5} fill="#ef8a6a" opacity={blush * 0.55} />
          <Circle cx={75} cy={57} r={6.5} fill="#ef8a6a" opacity={blush * 0.55} />
        </>
      ) : null}

      {tear > 0 ? <Path d="M33 50 q-3.5 6 0 8 q3.5 -2 0 -8 z" fill="#7fb3e6" opacity={tear} /> : null}

      <Path
        d={mouthPath}
        stroke={INK}
        strokeWidth={2.8}
        fill={mouthOpen ? '#7a2e1f' : 'none'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Carita que refleja el ánimo elegido: sus rasgos siguen al slider en continuo,
 * se mueve según el estado y salta cada vez que cambia de estado.
 */
export function MoodFace({ value, size }: MoodFaceProps) {
  const moodIndex = Math.round(clampMoodValue(value));
  const idle = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const [blinking, setBlinking] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const { duration } = IDLE_MOTION[moodIndex];
    const ease = Easing.inOut(Easing.sin);
    idle.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(idle, { toValue: 1, duration, easing: ease, useNativeDriver: true }),
        Animated.timing(idle, { toValue: 0, duration, easing: ease, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [moodIndex, idle, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    pop.setValue(0.86);
    const animation = Animated.spring(pop, { toValue: 1, speed: 18, bounciness: 14, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [moodIndex, pop, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        setBlinking(true);
        timer = setTimeout(() => {
          setBlinking(false);
          schedule();
        }, 130);
      }, 2400 + Math.random() * 2600);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [reduceMotion]);

  const { bob, rotate } = IDLE_MOTION[moodIndex];

  return (
    <Animated.View
      style={{
        transform: [
          { translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [0, -bob] }) },
          {
            rotate: idle.interpolate({ inputRange: [0, 1], outputRange: [`${-rotate}deg`, `${rotate}deg`] }),
          },
          { scale: pop },
        ],
      }}
    >
      <FaceDrawing value={value} size={size} blinking={blinking} />
    </Animated.View>
  );
}
