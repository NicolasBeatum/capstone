import React, { useId } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useBreath } from '@/shared/motion/breath';
import { motionDistance } from '@/shared/motion/motionTokens';

/* Tokens del efecto glass/liquid compartidos con las hojas de estilo */
export const glassTokens = {
  surface: 'rgba(255, 255, 255, 0.55)',
  surfaceStrong: 'rgba(255, 255, 255, 0.72)',
  border: 'rgba(255, 255, 255, 0.90)',
  sheen: 'rgba(255, 255, 255, 0.90)',
  shadowColor: '#6b5a33',
  shadow: {
    shadowColor: '#6b5a33',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 5,
  },
};

/* En web los id de SVG son globales al documento. Con varias pantallas montadas a la vez
 * (la anterior queda oculta), un id repetido apunta al gradiente de la oculta y el fondo
 * no se pinta. Un sufijo único por instancia evita el choque. */
function useGradientIds<Name extends string>(...names: Name[]): Record<Name, string> {
  const suffix = useId().replace(/[^a-zA-Z0-9]/g, '');
  return Object.fromEntries(names.map((name) => [name, `${name}-${suffix}`])) as Record<Name, string>;
}

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/* Card estilo vidrio: superficie translúcida, borde luminoso y brillo superior */
export function GlassCard({ children, style }: GlassCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.sheen} pointerEvents="none" />
      {children}
    </View>
  );
}

interface LiquidPanelProps {
  children: React.ReactNode;
  from: string;
  to: string;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/* Panel con gradiente líquido (SVG) usado como fondo de banners y destacados */
export function LiquidPanel({ children, from, to, radius = 24, style }: LiquidPanelProps) {
  const ids = useGradientIds('liquidPanelGradient');
  return (
    <View style={[styles.panel, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id={ids.liquidPanelGradient} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${ids.liquidPanelGradient})`} rx={radius} />
      </Svg>
      {children}
    </View>
  );
}

/* Card líquida: gradiente cálido en lugar de vidrio translúcido, con brillo superior */
export function LiquidCard({ children, style }: GlassCardProps) {
  const ids = useGradientIds('liquidCardGradient');
  return (
    <View style={[styles.card, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id={ids.liquidCardGradient} x1="0" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor="#fffef9" />
            <Stop offset="1" stopColor="#f6ebd0" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${ids.liquidCardGradient})`} rx={28} />
      </Svg>
      <View style={styles.sheen} pointerEvents="none" />
      {children}
    </View>
  );
}

/* Orbes de luz suaves detrás del contenido; dan el fondo líquido del glassmorphism.
 * Respiran en ciclos de 10 s (4 s inhalar, 6 s exhalar) con un cambio muy sutil. */
export function LiquidBackground() {
  const { width, height } = useWindowDimensions();
  const breath = useBreath();
  const ids = useGradientIds('orbYellow', 'orbSage', 'orbAmber');

  const breathStyle = breath
    ? {
        opacity: breath.interpolate({
          inputRange: [0, 1],
          outputRange: [motionDistance.breathOpacityMin, motionDistance.breathOpacityMax],
        }),
        transform: [
          {
            scale: breath.interpolate({
              inputRange: [0, 1],
              outputRange: [1, motionDistance.breathScale],
            }),
          },
        ],
      }
    : null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, breathStyle]} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id={ids.orbYellow} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="rgba(248, 214, 112, 0.85)" />
            <Stop offset="1" stopColor="rgba(248, 214, 112, 0)" />
          </RadialGradient>
          <RadialGradient id={ids.orbSage} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="rgba(158, 168, 112, 0.30)" />
            <Stop offset="1" stopColor="rgba(158, 168, 112, 0)" />
          </RadialGradient>
          <RadialGradient id={ids.orbAmber} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="rgba(238, 178, 66, 0.60)" />
            <Stop offset="1" stopColor="rgba(238, 178, 66, 0)" />
          </RadialGradient>
        </Defs>
        <Circle cx={width * 0.92} cy={height * 0.16} r={300} fill={`url(#${ids.orbYellow})`} />
        <Circle cx={width * 0.02} cy={height * 0.46} r={300} fill={`url(#${ids.orbSage})`} />
        <Circle cx={width * 0.85} cy={height * 0.82} r={320} fill={`url(#${ids.orbAmber})`} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: glassTokens.surface,
    borderWidth: 1,
    borderColor: glassTokens.border,
    borderRadius: 28,
    ...glassTokens.shadow,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: glassTokens.sheen,
  },
  panel: {
    borderRadius: 24,
  },
});
