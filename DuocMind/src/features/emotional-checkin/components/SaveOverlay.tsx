import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Brote } from '@/shared/components/Brote';
import { LiquidBackground } from '@/shared/components/Glass';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { ScalePress } from '@/shared/components/ScalePress';
import {
  motionDistance,
  motionDuration,
  motionEasing,
  NATIVE_DRIVER,
} from '@/shared/motion/motionTokens';
import { useReducedMotion } from '@/shared/motion/useReducedMotion';
import { fontFamily as font } from '@/shared/theme/typography';

interface SaveOverlayProps {
  /** 'saving' muestra la gota a pantalla completa; 'thanks' el agradecimiento. */
  phase: 'saving' | 'thanks';
  /** Posición del ánimo registrado (0 a 1) para dibujar el Brote del agradecimiento. */
  t: number;
  /** El registro quedó solo en el dispositivo y se enviará al recuperar conexión. */
  savedOffline: boolean;
  onContinue: () => void;
}

const CREAM = '#f3ecda';
const NAVY = '#1a2b44';
const MUTED = '#8a8272';

/**
 * Pantalla completa que cubre el check-in al guardar: primero la gota que respira y,
 * cuando el registro queda guardado, un agradecimiento que explica que ya no hace
 * falta registrar de nuevo antes de llevar a la persona al inicio.
 */
export function SaveOverlay({ phase, t, savedOffline, onContinue }: SaveOverlayProps) {
  const reduceMotion = useReducedMotion();
  const appear = useRef(new Animated.Value(0)).current;
  const swap = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(appear, {
      toValue: 1,
      duration: motionDuration.screen,
      easing: motionEasing.calm,
      useNativeDriver: NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [appear]);

  useEffect(() => {
    const animation = Animated.timing(swap, {
      toValue: phase === 'thanks' ? 1 : 0,
      duration: motionDuration.screen + 200,
      easing: motionEasing.calm,
      useNativeDriver: NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [phase, swap]);

  const thanksRise = reduceMotion
    ? 0
    : swap.interpolate({ inputRange: [0.4, 1], outputRange: [motionDistance.rise, 0], extrapolate: 'clamp' });

  return (
    <Animated.View
      style={[styles.overlay, { opacity: appear }]}
      accessibilityViewIsModal
      importantForAccessibility="yes"
    >
      <LiquidBackground />

      <Animated.View
        style={[
          styles.center,
          { opacity: swap.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0], extrapolate: 'clamp' }) },
        ]}
        pointerEvents="none"
      >
        <GotaLoader size="lg" text="Guardando tu registro…" />
      </Animated.View>

      <Animated.View
        style={[
          styles.center,
          {
            opacity: swap.interpolate({ inputRange: [0.4, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
            transform: [{ translateY: thanksRise }],
          },
        ]}
        pointerEvents={phase === 'thanks' ? 'auto' : 'none'}
      >
        <Brote t={t} size={150} />
        <Text style={styles.title} accessibilityLiveRegion="polite">
          ¡Gracias por registrar tu emoción de hoy!
        </Text>
        <Text style={styles.body}>
          {savedOffline
            ? 'Quedó guardado en tu dispositivo y se enviará cuando tengas conexión. No necesitas registrarla otra vez.'
            : 'Tu registro ya quedó guardado. No necesitas registrarlo otra vez; mañana puedes volver a contarnos cómo te sientes.'}
        </Text>
        <ScalePress
          style={styles.button}
          onPress={onContinue}
          accessibilityRole="button"
          accessibilityLabel="Ir al inicio"
        >
          <Text style={styles.buttonText}>Ir al inicio</Text>
        </ScalePress>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 50,
    elevation: 50,
    backgroundColor: CREAM,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  title: {
    marginTop: 18,
    fontSize: 24,
    lineHeight: 30,
    color: NAVY,
    textAlign: 'center',
    fontFamily: font.extraBold,
  },
  body: {
    marginTop: 10,
    maxWidth: 320,
    fontSize: 15,
    lineHeight: 22,
    color: MUTED,
    textAlign: 'center',
    fontFamily: font.semiBold,
  },
  button: {
    marginTop: 26,
    minWidth: 180,
    height: 50,
    paddingHorizontal: 32,
    borderRadius: 25,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    letterSpacing: 0.4,
    fontFamily: font.extraBold,
  },
});
