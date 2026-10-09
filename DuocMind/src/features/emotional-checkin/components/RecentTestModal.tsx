import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { glassTokens } from '@/shared/components/Glass';
import { ClipboardIcon, SparkleIcon } from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import { fontFamily as font } from '@/shared/theme/typography';
import { formatDaysAgo } from '../domain/stressTestRecency';

interface RecentTestModalProps {
  visible: boolean;
  /** Días calendario desde la última aplicación del test */
  days: number;
  onClose: () => void;
  onContinue: () => void;
}

/* backdropFilter solo existe en web; en Android el vidrio se simula con la superficie translúcida */
const webBlur = (amount: number): ViewStyle =>
  Platform.OS === 'web' ? ({ backdropFilter: `blur(${amount}px)` } as ViewStyle) : {};

/**
 * Pop-up glass que avisa que el estudiante ya respondió el Test Estrés Percibido,
 * mostrado sobre la vista actual antes de navegar al test.
 * Entrada inspirada en React Bits (Animated Content + Count Up), hecha con
 * Animated de React Native para que funcione igual en web y Android.
 */
export function RecentTestModal({ visible, days, onClose, onContinue }: RecentTestModalProps) {
  const card = useRef(new Animated.Value(0)).current;
  const counter = useRef(new Animated.Value(0)).current;
  const [shownDays, setShownDays] = useState(0);
  // Se lee una vez al montar: esperar la consulta al abrir retrasaba la animación un frame.
  const reduceMotion = useRef(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        reduceMotion.current = enabled;
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!visible) return;
    counter.setValue(0);
    setShownDays(0);
    const listener = counter.addListener(({ value }) => setShownDays(Math.round(value)));

    if (reduceMotion.current) {
      card.setValue(1);
      counter.setValue(days);
      return () => counter.removeListener(listener);
    }

    // Mismo resorte que el panel de notificaciones; el fondo lo desvanece el Modal.
    card.setValue(0);
    const entrance = Animated.spring(card, {
      toValue: 1,
      speed: 16,
      bounciness: 0,
      useNativeDriver: true,
    });
    // El contador re-renderiza cada frame, así que parte cuando la tarjeta ya se asentó.
    const count = Animated.timing(counter, {
      toValue: days,
      duration: Math.min(900, 300 + days * 50),
      delay: 220,
      easing: Easing.out(Easing.cubic),
      // El listener necesita el valor en JS.
      useNativeDriver: false,
    });
    entrance.start();
    count.start();

    return () => {
      entrance.stop();
      count.stop();
      counter.removeListener(listener);
    };
  }, [visible, days, card, counter]);

  const cardStyle = {
    opacity: card,
    transform: [
      { translateY: card.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
      { scale: card.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
    ],
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, webBlur(10)]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Cerrar aviso"
      />
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          style={[styles.card, webBlur(24), cardStyle]}
          accessibilityViewIsModal
          accessibilityRole="alert"
          accessibilityLabel={`Ya has hecho el Test Estrés Percibido ${formatDaysAgo(days)}`}
        >
          {/* Orbes líquidos dentro del vidrio, mismos tonos que LiquidBackground */}
          <Svg style={styles.liquid} width="100%" height="100%" pointerEvents="none">
            <Defs>
              <RadialGradient id="recentTestOrbAmber" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="rgba(238, 178, 66, 0.55)" />
                <Stop offset="1" stopColor="rgba(238, 178, 66, 0)" />
              </RadialGradient>
              <RadialGradient id="recentTestOrbSage" cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor="rgba(158, 168, 112, 0.35)" />
                <Stop offset="1" stopColor="rgba(158, 168, 112, 0)" />
              </RadialGradient>
            </Defs>
            <Circle cx="92%" cy="6%" r="150" fill="url(#recentTestOrbAmber)" />
            <Circle cx="4%" cy="96%" r="140" fill="url(#recentTestOrbSage)" />
          </Svg>
          <View style={styles.sheen} pointerEvents="none" />

          <View style={styles.iconBadge}>
            <ClipboardIcon size={30} color="#b4561a" />
            <View style={styles.sparkle}>
              <SparkleIcon size={12} color="#e8a93c" />
            </View>
          </View>

          <Text style={styles.eyebrow}>TEST ESTRÉS PERCIBIDO</Text>
          <Text style={styles.title}>Ya respondiste este test</Text>

          <View style={styles.counterBox}>
            {days === 0 ? (
              <Text style={styles.counterNumber}>Hoy</Text>
            ) : (
              <>
                <Text style={styles.counterNumber}>{shownDays}</Text>
                <Text style={styles.counterUnit}>{days === 1 ? 'día' : 'días'}</Text>
              </>
            )}
          </View>

          <Text style={styles.message}>
            Ya has hecho el Test Estrés Percibido {formatDaysAgo(days)}.
          </Text>

          <View style={styles.buttons}>
            <ScalePress style={styles.primaryButton} onPress={onContinue} accessibilityRole="button">
              <Text style={styles.primaryButtonText}>Continuar al test →</Text>
            </ScalePress>
            <ScalePress style={styles.secondaryButton} onPress={onClose} accessibilityRole="button">
              <Text style={styles.secondaryButtonText}>Ahora no</Text>
            </ScalePress>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(26, 43, 68, 0.28)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'web' ? glassTokens.surface : 'rgba(255, 252, 244, 0.94)',
    borderWidth: 1,
    borderColor: glassTokens.border,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    ...glassTokens.shadow,
  },
  liquid: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 22,
    right: 22,
    height: 2,
    borderRadius: 1,
    backgroundColor: glassTokens.sheen,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(253, 238, 226, 0.85)',
    borderWidth: 1,
    borderColor: glassTokens.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  sparkle: {
    position: 'absolute',
    top: 6,
    right: 4,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: '#b4561a',
    fontFamily: font.bold,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    color: '#1a2b44',
    textAlign: 'center',
    fontFamily: font.bold,
    marginBottom: 16,
  },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    backgroundColor: glassTokens.surfaceStrong,
    borderWidth: 1,
    borderColor: glassTokens.border,
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 10,
    marginBottom: 14,
  },
  counterNumber: {
    fontSize: 40,
    lineHeight: 46,
    color: '#1a2b44',
    fontFamily: font.bold,
  },
  counterUnit: {
    fontSize: 16,
    color: '#1a2b44',
    fontFamily: font.bold,
  },
  message: {
    fontSize: 15,
    lineHeight: 21,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttons: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#1a2b44',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: font.bold,
  },
  secondaryButton: {
    backgroundColor: glassTokens.surfaceStrong,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: glassTokens.border,
  },
  secondaryButtonText: {
    color: '#1a2b44',
    fontSize: 15,
    fontFamily: font.bold,
  },
});
