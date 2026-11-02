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
import Svg, { Circle } from 'react-native-svg';
import { glassTokens } from '@/shared/components/Glass';
import { ScalePress } from '@/shared/components/ScalePress';
import { fontFamily as font } from '@/shared/theme/typography';
import { formatDaysAgo, STRESS_TEST_REMINDER_DAYS } from '../domain/stressTestRecency';

interface RecentTestModalProps {
  visible: boolean;
  /** Días calendario desde la última aplicación del test */
  days: number;
  onClose: () => void;
  onContinue: () => void;
}

const NAVY = '#1a2b44';
const SAGE = '#468a6c';
const MUTED = '#8a8272';
const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const RING_SIZE = 136;
const RING_STROKE = 10;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/* backdropFilter solo existe en web; en Android el vidrio se simula con la superficie translúcida */
const webBlur = (amount: number): ViewStyle =>
  Platform.OS === 'web' ? ({ backdropFilter: `blur(${amount}px)` } as ViewStyle) : {};

/** Primer día en que el inicio vuelve a avisar: pasados los 30 días desde la última vez. */
function formatNextReminder(days: number): string {
  const next = new Date();
  next.setDate(next.getDate() + STRESS_TEST_REMINDER_DAYS + 1 - days);
  return `${next.getDate()} de ${MONTHS[next.getMonth()]}`;
}

/**
 * Aviso de que el Test Estrés Percibido ya se respondió dentro del ciclo de 30 días.
 * El anillo muestra cuánto del ciclo pasó y el texto dice cuándo vuelve a corresponder;
 * la acción principal es cerrar, y responder igual queda como opción secundaria.
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
    const listener = counter.addListener(({ value }) => setShownDays(value));

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
    // El anillo y el número avanzan juntos cuando la tarjeta ya se asentó.
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

  const progress = Math.min(shownDays / STRESS_TEST_REMINDER_DAYS, 1);
  const nextReminder = formatNextReminder(days);
  const summary = `Lo respondiste ${formatDaysAgo(days)}. El test se responde cada ${STRESS_TEST_REMINDER_DAYS} días; te avisaremos desde el ${nextReminder}.`;

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
          accessibilityLabel={`Ya respondiste este test. ${summary}`}
        >
          <View style={styles.sheen} pointerEvents="none" />

          <View style={styles.ring} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke="#ece4cf"
                strokeWidth={RING_STROKE}
                fill="none"
              />
              {/* Con 0 días el extremo redondeado dibujaría un punto suelto. */}
              {progress > 0 ? (
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke={SAGE}
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${RING_LENGTH} ${RING_LENGTH}`}
                  strokeDashoffset={RING_LENGTH * (1 - progress)}
                  fill="none"
                  transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                />
              ) : null}
            </Svg>
            <View style={styles.ringCenter}>
              {days === 0 ? (
                <Text style={styles.ringNumber}>Hoy</Text>
              ) : (
                <>
                  <Text style={styles.ringNumber}>{Math.round(shownDays)}</Text>
                  <Text style={styles.ringUnit}>
                    {days === 1 ? 'día' : 'días'} de {STRESS_TEST_REMINDER_DAYS}
                  </Text>
                </>
              )}
            </View>
          </View>

          <Text style={styles.title}>Ya respondiste este test</Text>
          <Text style={styles.message}>{summary}</Text>

          <ScalePress style={styles.primaryButton} onPress={onClose} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>Entendido</Text>
          </ScalePress>
          <ScalePress style={styles.secondaryButton} onPress={onContinue} accessibilityRole="button">
            <Text style={styles.secondaryButtonText}>Responder de todas formas</Text>
          </ScalePress>
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
    maxWidth: 360,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 253, 247, 0.86)' : 'rgba(255, 253, 247, 0.97)',
    borderWidth: 1,
    borderColor: glassTokens.border,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 14,
    alignItems: 'center',
    ...glassTokens.shadow,
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
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    marginBottom: 18,
  },
  ringCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringNumber: {
    fontSize: 38,
    lineHeight: 42,
    color: NAVY,
    fontFamily: font.extraBold,
  },
  ringUnit: {
    fontSize: 12,
    color: MUTED,
    fontFamily: font.semiBold,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    color: NAVY,
    textAlign: 'center',
    fontFamily: font.extraBold,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    color: MUTED,
    textAlign: 'center',
    fontFamily: font.regular,
    marginBottom: 22,
  },
  primaryButton: {
    alignSelf: 'stretch',
    height: 50,
    borderRadius: 25,
    backgroundColor: NAVY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: font.extraBold,
  },
  secondaryButton: {
    alignSelf: 'stretch',
    minHeight: 44,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Salvia más oscura que el anillo: el texto necesita 4.5:1 sobre la tarjeta.
  secondaryButtonText: {
    color: '#2b6b50',
    fontSize: 14,
    fontFamily: font.bold,
  },
});
