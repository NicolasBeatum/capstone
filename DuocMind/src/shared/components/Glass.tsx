import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useReduceMotion } from './useReduceMotion';

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
  return (
    <View style={[styles.panel, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="liquidPanelGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={from} />
            <Stop offset="1" stopColor={to} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#liquidPanelGradient)" rx={radius} />
      </Svg>
      {children}
    </View>
  );
}

/* Card líquida: gradiente cálido en lugar de vidrio translúcido, con brillo superior */
export function LiquidCard({ children, style }: GlassCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="liquidCardGradient" x1="0" y1="0" x2="0.5" y2="1">
            <Stop offset="0" stopColor="#fffef9" />
            <Stop offset="1" stopColor="#f6ebd0" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#liquidCardGradient)" rx={28} />
      </Svg>
      <View style={styles.sheen} pointerEvents="none" />
      {children}
    </View>
  );
}

/* Margen extra del lienzo: al derivar, los orbes nunca dejan ver el borde */
const DRIFT_PAD = 32;

/* Orbes de luz suaves detrás del contenido; dan el fondo líquido del glassmorphism.
 * Derivan muy despacio (inspirado en Aurora/Orb de React Bits) para dar vida al fondo. */
export const LiquidBackground = React.memo(function LiquidBackground() {
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return undefined;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [drift, reduceMotion]);

  const reach = DRIFT_PAD * 0.8;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={{
          position: 'absolute',
          left: -DRIFT_PAD,
          top: -DRIFT_PAD,
          transform: [
            { translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-reach, reach] }) },
            { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [reach * 0.6, -reach * 0.6] }) },
          ],
        }}
      >
      <Svg width={width + DRIFT_PAD * 2} height={height + DRIFT_PAD * 2}>
        <Defs>
          <RadialGradient id="orbYellow" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="rgba(248, 214, 112, 0.85)" />
            <Stop offset="1" stopColor="rgba(248, 214, 112, 0)" />
          </RadialGradient>
          <RadialGradient id="orbSage" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="rgba(158, 168, 112, 0.30)" />
            <Stop offset="1" stopColor="rgba(158, 168, 112, 0)" />
          </RadialGradient>
          <RadialGradient id="orbAmber" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="rgba(238, 178, 66, 0.60)" />
            <Stop offset="1" stopColor="rgba(238, 178, 66, 0)" />
          </RadialGradient>
        </Defs>
        <Circle cx={DRIFT_PAD + width * 0.92} cy={DRIFT_PAD + height * 0.16} r={300} fill="url(#orbYellow)" />
        <Circle cx={DRIFT_PAD + width * 0.02} cy={DRIFT_PAD + height * 0.46} r={300} fill="url(#orbSage)" />
        <Circle cx={DRIFT_PAD + width * 0.85} cy={DRIFT_PAD + height * 0.82} r={320} fill="url(#orbAmber)" />
      </Svg>
      </Animated.View>
    </View>
  );
});

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
