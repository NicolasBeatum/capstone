import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { NATIVE_DRIVER } from '@/shared/motion/motionTokens';
import { useReducedMotion } from '@/shared/motion/useReducedMotion';
import { BROTE_COLORS, broteParams, mixColors, safeT } from './broteParams';

interface BroteProps {
  /** Posición continua de 0 (Muy mal) a 1 (Muy bien). */
  t: number;
  /** Ancho en px; el alto sigue la proporción del dibujo. */
  size?: number;
  /** Balanceo en reposo y destellos que titilan. */
  idle?: boolean;
}

const VIEW_W = 160;
const VIEW_H = 220;
const CENTER_X = 80;
const STEM_BASE_Y = 150;
const OUTLINE = 4.5;
const DETAIL_OUTLINE = 3.4;
const SWAY_DEGREES = 2;
const SWAY_HALF_CYCLE_MS = 2000;
const TWINKLE_HALF_CYCLE_MS = 900;

const { ink } = BROTE_COLORS;
const SPARKLES = [
  { x: 24, y: 66, r: 6 },
  { x: 138, y: 46, r: 8 },
  { x: 134, y: 110, r: 5 },
  { x: 28, y: 118, r: 4 },
];

type Point = { x: number; y: number };

// El tallo siempre crece recto hacia arriba.
const GROWTH_ANGLE = -Math.PI / 2;
// Escena de descanso (círculo, luna y nubes) detrás del Brote.
const SCENE_CENTER = { x: CENTER_X, y: 130 };
const SCENE_RADIUS = 78;
const MOON = { x: 112, y: 82, r: 11 };
const STARS = [
  { x: 44, y: 84, r: 5 },
  { x: 30, y: 128, r: 3.5 },
  { x: 130, y: 128, r: 3.5 },
  { x: 92, y: 62, r: 3 },
];

/** Hoja o pétalo en forma de lente: sale de `base` en la dirección `angle` (radianes). */
function leafPath(base: Point, angle: number, length: number): string {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const tip = { x: base.x + dx * length, y: base.y + dy * length };
  const mid = { x: base.x + (dx * length) / 2, y: base.y + (dy * length) / 2 };
  const offset = length * 0.52;
  const c1 = { x: mid.x - dy * offset, y: mid.y + dx * offset };
  const c2 = { x: mid.x + dy * offset, y: mid.y - dx * offset };
  return `M${base.x} ${base.y} Q${c1.x} ${c1.y} ${tip.x} ${tip.y} Q${c2.x} ${c2.y} ${base.x} ${base.y} Z`;
}

function sparklePath({ x, y, r }: { x: number; y: number; r: number }): string {
  return `M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z`;
}

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Planta: tallo, hojas y capullo/flor. Va detrás del macetero para que la base quede tapada. */
function PlantLayer({ t, size }: { t: number; size: number }) {
  const p = broteParams(t);
  const height = (size * VIEW_H) / VIEW_W;

  const tip: Point = { x: CENTER_X, y: STEM_BASE_Y - p.stemHeight };
  const leafBase: Point = { x: CENTER_X, y: STEM_BASE_Y - p.stemHeight * p.leafAttach };
  const stemPath = `M${CENTER_X} ${STEM_BASE_Y} L${tip.x} ${tip.y}`;
  const leafAngle = toRadians(p.leafAngle);

  const budEnd: Point = {
    x: tip.x + Math.cos(GROWTH_ANGLE) * p.budLength * 0.5,
    y: tip.y + Math.sin(GROWTH_ANGLE) * p.budLength * 0.5,
  };
  const budScale = 1 - p.flower;
  const petalLength = 16 * p.flower;
  const centerColor = mixColors(p.budColor, BROTE_COLORS.flowerCenter, p.flower);
  // El contorno crece con la flor; a escala mínima taparía los pétalos.
  const petalOutline = DETAIL_OUTLINE * 0.8 * Math.min(1, p.flower * p.flower * 1.4);

  return (
    <Svg width={size} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
      <Path d={stemPath} stroke={BROTE_COLORS.stem} strokeWidth={6} fill="none" strokeLinecap="round" />

      <Path
        d={leafPath(leafBase, leafAngle, p.leafLength)}
        fill={BROTE_COLORS.leaf}
        stroke={ink}
        strokeWidth={DETAIL_OUTLINE}
        strokeLinejoin="round"
      />
      <Path
        d={leafPath(leafBase, Math.PI - leafAngle, p.leafLength)}
        fill={BROTE_COLORS.leaf}
        stroke={ink}
        strokeWidth={DETAIL_OUTLINE}
        strokeLinejoin="round"
      />

      {budScale > 0 ? (
        <Path
          d={leafPath(tip, GROWTH_ANGLE, p.budLength * budScale)}
          fill={p.budColor}
          stroke={ink}
          strokeWidth={DETAIL_OUTLINE}
          strokeLinejoin="round"
        />
      ) : null}

      {p.flower > 0 ? (
        <G>
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <Path
              key={index}
              d={leafPath(budEnd, toRadians(-90 + index * 60), petalLength)}
              fill={BROTE_COLORS.petal}
              stroke={ink}
              strokeWidth={petalOutline}
              strokeLinejoin="round"
            />
          ))}
          <Circle
            cx={budEnd.x}
            cy={budEnd.y}
            r={5.5 * p.flower}
            fill={centerColor}
            stroke={ink}
            strokeWidth={petalOutline}
          />
        </G>
      ) : null}
    </Svg>
  );
}

/** Macetero con cara; sus rasgos cambian de forma continua con t. */
function PotLayer({ t, size }: { t: number; size: number }) {
  const { potColor, face } = broteParams(t);
  const height = (size * VIEW_H) / VIEW_W;
  const rimColor = mixColors(potColor, '#ffffff', 0.3);

  const mouthY = 193;
  const x0 = CENTER_X - face.mouthHalfWidth;
  const x1 = CENTER_X + face.mouthHalfWidth;
  const lower = mouthY + face.mouthCurve;
  const upper = mouthY + face.mouthCurve * face.mouthLowerCurve;
  const mouthPath = `M${x0} ${mouthY} Q${CENTER_X} ${lower} ${x1} ${mouthY} Q${CENTER_X} ${upper} ${x0} ${mouthY} Z`;

  const eyeY = 180;
  const eyeXs = [66, 94];

  return (
    <Svg
      width={size}
      height={height}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      style={StyleSheet.absoluteFill}
    >
      <Ellipse cx={CENTER_X} cy={213} rx={44} ry={5} fill="rgba(26, 38, 56, 0.1)" />
      <Path
        d="M46 157 L114 157 L108 206 Q107 210 103 210 L57 210 Q53 210 52 206 Z"
        fill={potColor}
        stroke={ink}
        strokeWidth={OUTLINE}
        strokeLinejoin="round"
      />
      <Path
        d="M45.5 142 H114.5 Q121 142 121 148.5 V150.5 Q121 157 114.5 157 H45.5 Q39 157 39 150.5 V148.5 Q39 142 45.5 142 Z"
        fill={rimColor}
        stroke={ink}
        strokeWidth={OUTLINE}
        strokeLinejoin="round"
      />

      {face.dotEyes > 0 ? (
        <G opacity={face.dotEyes}>
          {eyeXs.map((x) => (
            <G key={x}>
              <Circle cx={x} cy={eyeY} r={4} fill={ink} />
              <Circle cx={x + 1.3} cy={eyeY - 1.3} r={1.2} fill="#ffffff" />
            </G>
          ))}
        </G>
      ) : null}
      {face.happyEyes > 0 ? (
        <G opacity={face.happyEyes}>
          {eyeXs.map((x) => (
            <Path
              key={x}
              d={`M${x - 6} ${eyeY + 2} Q${x} ${eyeY - 6} ${x + 6} ${eyeY + 2}`}
              stroke={ink}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
            />
          ))}
        </G>
      ) : null}

      {face.blush > 0 ? (
        <G opacity={face.blush * 0.75}>
          <Ellipse cx={55} cy={190} rx={6} ry={4} fill={BROTE_COLORS.blush} />
          <Ellipse cx={105} cy={190} rx={6} ry={4} fill={BROTE_COLORS.blush} />
        </G>
      ) : null}

      <Path
        d={mouthPath}
        stroke={ink}
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="#7A2E1F"
        fillOpacity={face.mouthOpen}
      />
    </Svg>
  );
}

/** Círculo del color del estado (púrpura o verde); con luna y estrellas en Muy mal y nubes en Mal. */
function SceneLayer({ t, size }: { t: number; size: number }) {
  const { scene } = broteParams(t);
  const height = (size * VIEW_H) / VIEW_W;
  const { moon: m, cloud: c } = scene;
  // Media luna: arco exterior y arco interior más suave, abierta hacia la derecha.
  const moonPath = `M${MOON.x} ${MOON.y - MOON.r} A${MOON.r} ${MOON.r} 0 1 0 ${MOON.x} ${MOON.y + MOON.r} A${MOON.r * 1.2} ${MOON.r * 1.2} 0 0 1 ${MOON.x} ${MOON.y - MOON.r} Z`;

  return (
    <Svg width={size} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} style={StyleSheet.absoluteFill}>
      <Circle
        cx={SCENE_CENTER.x}
        cy={SCENE_CENTER.y}
        r={SCENE_RADIUS}
        fill={scene.tint}
        opacity={scene.circle}
      />
      {m > 0 ? (
        <G opacity={m}>
          <Path d={moonPath} fill={BROTE_COLORS.moon} />
          {STARS.map((star) => (
            <Path key={`${star.x}-${star.y}`} d={sparklePath(star)} fill={BROTE_COLORS.moon} />
          ))}        </G>
      ) : null}
      {c > 0 ? (
        <G opacity={c * 0.9} fill={BROTE_COLORS.cloud}>
          <Ellipse cx={116} cy={90} rx={21} ry={7} />
          <Circle cx={105} cy={85} r={9} />
          <Circle cx={117} cy={80} r={11} />
          <Circle cx={128} cy={87} r={8} />
          <Ellipse cx={44} cy={104} rx={12} ry={5} />
          <Circle cx={40} cy={100} r={5} />
          <Circle cx={50} cy={99} r={6} />
        </G>
      ) : null}
    </Svg>
  );
}

function SparkleLayer({ size }: { size: number }) {
  const height = (size * VIEW_H) / VIEW_W;
  return (
    <Svg width={size} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
      {SPARKLES.map((sparkle) => (
        <Path key={`${sparkle.x}-${sparkle.y}`} d={sparklePath(sparkle)} fill={BROTE_COLORS.sparkle} />
      ))}
    </Svg>
  );
}

/**
 * Brote: una plantita en un macetero con cara que se transforma de forma continua
 * según t. El macetero es siempre amarillo. Con t bajo descansa (verde, erguida y
 * serena, en un círculo púrpura con luna o nubes), nunca se marchita ni se ve triste;
 * con t alto crece, florece y destella dentro de un círculo verde. En reposo se balancea suavemente, salvo que se pida
 * reducir el movimiento.
 */
export function Brote({ t, size = 200, idle = true }: BroteProps) {
  const reduceMotion = useReducedMotion();
  const animate = idle && !reduceMotion;
  const sway = useRef(new Animated.Value(-1)).current;
  const twinkle = useRef(new Animated.Value(0)).current;
  const clamped = safeT(t);
  const sparkle = broteParams(clamped).sparkle;
  const twinkling = animate && sparkle > 0;

  useEffect(() => {
    if (!animate) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: SWAY_HALF_CYCLE_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVE_DRIVER,
        }),
        Animated.timing(sway, {
          toValue: -1,
          duration: SWAY_HALF_CYCLE_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVE_DRIVER,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [animate, sway]);

  useEffect(() => {
    if (!twinkling) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, {
          toValue: 1,
          duration: TWINKLE_HALF_CYCLE_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVE_DRIVER,
        }),
        Animated.timing(twinkle, {
          toValue: 0,
          duration: TWINKLE_HALF_CYCLE_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: NATIVE_DRIVER,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [twinkling, twinkle]);

  const height = (size * VIEW_H) / VIEW_W;
  // La rotación pivota en la base del tallo, no en el centro del dibujo. Los
  // porcentajes van enteros: en Android, React Native no lee decimales en
  // transformOrigin (de "68.18%" toma solo "18%"), el pivote queda lejísimos y
  // la planta sale de la pantalla al balancearse.
  const swayStyle = useMemo(
    () =>
      animate
        ? {
            transformOrigin: `${Math.round((CENTER_X / VIEW_W) * 100)}% ${Math.round((STEM_BASE_Y / VIEW_H) * 100)}%`,
            transform: [
              {
                rotate: sway.interpolate({
                  inputRange: [-1, 1],
                  outputRange: [`${-SWAY_DEGREES}deg`, `${SWAY_DEGREES}deg`],
                }),
              },
            ],
          }
        : null,
    [animate, sway],
  );
  const sparkleOpacity = twinkling
    ? Animated.multiply(
        twinkle.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }),
        sparkle,
      )
    : sparkle;

  return (
    <View
      style={{ width: size, height }}
      // Es decorativo: el estado lo anuncia la barra de ánimo.
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <SceneLayer t={clamped} size={size} />
      <Animated.View style={[StyleSheet.absoluteFill, swayStyle]}>
        <PlantLayer t={clamped} size={size} />
      </Animated.View>
      <PotLayer t={clamped} size={size} />
      {sparkle > 0 ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: sparkleOpacity }]} pointerEvents="none">
          <SparkleLayer size={size} />
        </Animated.View>
      ) : null}
    </View>
  );
}
