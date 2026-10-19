import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  findNodeHandle,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { ScalePress } from '@/shared/components/ScalePress';
import {
  motionDuration,
  motionEasing,
  NATIVE_DRIVER,
} from '@/shared/motion/motionTokens';
import { useReducedMotion } from '@/shared/motion/useReducedMotion';
import { fontFamily as font } from '@/shared/theme/typography';
import type { TutorialView } from '../application/tutorialSession';
import {
  cardPlacement,
  isMeasurable,
  spotlightRect,
  type Rect,
} from '../domain/tutorialLayout';
import type { TutorialTargetId } from '../domain/tutorialSteps';

export type TutorialTargets = Partial<Record<TutorialTargetId, React.RefObject<View | null>>>;

interface TutorialOverlayProps {
  visible: boolean;
  /** Qué paso mostrar y qué botones ofrecer; null si el recorrido no está a la vista. */
  view: TutorialView | null;
  targets: TutorialTargets;
  onPrimary: () => void;
  onBack: () => void;
  onSkip: () => void;
  /** Botón Atrás del sistema: retrocede un paso o, si no puede, omite. */
  onSystemBack: () => void;
}

interface MeasuredLayout {
  stepId: string;
  rect: Rect | null;
}

const DIM = 'rgba(10, 18, 32, 0.66)';
const RING = '#f2c14e';
const CARD_GAP = 14;
const SCREEN_MARGIN = 16;
const MEASURE_TIMEOUT_MS = 250;
const BODY_MAX_HEIGHT_RATIO = 0.4;

/**
 * Recorrido guiado sobre el inicio. Un Modal bloquea los toques del resto de la
 * pantalla y, en Android, contiene el foco de accesibilidad y entrega el botón
 * Atrás. Si un elemento no se puede medir o no cabe en la ventana, el paso se
 * muestra centrado y sin resalte.
 */
export function TutorialOverlay({
  visible,
  view,
  targets,
  onPrimary,
  onBack,
  onSkip,
  onSystemBack,
}: TutorialOverlayProps) {
  const { width, height, fontScale } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const step = view?.step;
  const stepId = step?.id;
  const [layout, setLayout] = useState<MeasuredLayout | null>(null);
  const overlayFade = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const cardFade = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const titleRef = useRef<Text>(null);

  // Al ocultarse (p. ej. mientras se usa el check-in), el siguiente paso vuelve a medir.
  useEffect(() => {
    if (!visible) setLayout(null);
  }, [visible]);

  // Mide el elemento del paso; se repite al cambiar de paso, de tamaño o de texto.
  useEffect(() => {
    if (!visible || !step) return;
    const id = step.id;
    const targetRef = step.target ? targets[step.target]?.current : null;
    if (!targetRef) {
      setLayout({ stepId: id, rect: null });
      return;
    }
    let active = true;
    let measuredOnce = false;
    const frame = requestAnimationFrame(() => {
      targetRef.measureInWindow((x, y, w, h) => {
        if (!active) return;
        measuredOnce = true;
        const measured = { x, y, width: w, height: h };
        setLayout({ stepId: id, rect: isMeasurable(measured, { width, height }) ? measured : null });
      });
    });
    // Si la medición tarda, el paso se muestra centrado; una medición tardía lo corrige.
    const timeout = setTimeout(() => {
      if (active && !measuredOnce) setLayout({ stepId: id, rect: null });
    }, MEASURE_TIMEOUT_MS);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, [visible, step, targets, width, height, fontScale]);

  useEffect(() => {
    if (!visible) return;
    if (reduceMotion) {
      overlayFade.setValue(1);
      return;
    }
    overlayFade.setValue(0);
    const animation = Animated.timing(overlayFade, {
      toValue: 1,
      duration: motionDuration.reveal,
      easing: motionEasing.calm,
      useNativeDriver: NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [visible, reduceMotion, overlayFade]);

  const ready = stepId !== undefined && layout?.stepId === stepId;

  // Cada paso entra con un fundido; con movimiento reducido aparece de inmediato.
  useEffect(() => {
    if (!visible || !ready) return;
    // findNodeHandle no existe en web; allí el lector sigue el orden del documento.
    if (Platform.OS !== 'web' && titleRef.current) {
      const node = findNodeHandle(titleRef.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }
    if (reduceMotion) {
      cardFade.setValue(1);
      return;
    }
    cardFade.setValue(0);
    const animation = Animated.timing(cardFade, {
      toValue: 1,
      duration: motionDuration.tutorialStep,
      easing: motionEasing.calm,
      useNativeDriver: NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [visible, ready, stepId, reduceMotion, cardFade]);

  if (!view || !step) return null;

  const windowSize = { width, height };
  const rect = ready ? layout.rect : null;
  const spotlight = rect ? spotlightRect(rect, windowSize) : null;
  const placement = cardPlacement(rect, windowSize);

  const cardPosition =
    spotlight && placement === 'below'
      ? { top: spotlight.y + spotlight.height + CARD_GAP }
      : spotlight && placement === 'above'
        ? { bottom: height - spotlight.y + CARD_GAP }
        : null;

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onSystemBack}
    >
      <View style={styles.root}>
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: overlayFade }]}
          pointerEvents="none"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          {spotlight ? (
            <>
              <View style={[styles.dim, { top: 0, left: 0, right: 0, height: spotlight.y }]} />
              <View style={[styles.dim, { top: spotlight.y + spotlight.height, left: 0, right: 0, bottom: 0 }]} />
              <View style={[styles.dim, { top: spotlight.y, left: 0, width: spotlight.x, height: spotlight.height }]} />
              <View style={[styles.dim, { top: spotlight.y, left: spotlight.x + spotlight.width, right: 0, height: spotlight.height }]} />
              <View
                style={[
                  styles.ring,
                  { top: spotlight.y, left: spotlight.x, width: spotlight.width, height: spotlight.height },
                ]}
              />
            </>
          ) : (
            <View style={[styles.dim, StyleSheet.absoluteFill]} />
          )}
        </Animated.View>

        <View
          style={[
            styles.cardArea,
            cardPosition ?? styles.cardAreaCenter,
          ]}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[styles.card, { opacity: ready ? cardFade : 0 }]}
            accessibilityLiveRegion="polite"
          >
            <Text style={styles.position}>{view.position}</Text>
            <Text ref={titleRef} style={styles.title} accessibilityRole="header">
              {step.title}
            </Text>
            <ScrollView
              style={{ maxHeight: height * BODY_MAX_HEIGHT_RATIO }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.body}>{step.body}</Text>
            </ScrollView>
            <View style={styles.actions}>
              {view.canSkip ? (
                <ScalePress
                  style={styles.skipButton}
                  onPress={onSkip}
                  accessibilityRole="button"
                  accessibilityLabel="Omitir el tutorial"
                >
                  <Text style={styles.skipText}>Omitir</Text>
                </ScalePress>
              ) : null}
              <View style={styles.navActions}>
                {view.canGoBack ? (
                  <ScalePress
                    style={styles.secondaryButton}
                    onPress={onBack}
                    accessibilityRole="button"
                    accessibilityLabel="Volver al paso anterior"
                  >
                    <Text style={styles.secondaryText}>Atrás</Text>
                  </ScalePress>
                ) : null}
                <ScalePress
                  style={styles.primaryButton}
                  onPress={onPrimary}
                  accessibilityRole="button"
                  accessibilityLabel={view.primary.accessibilityLabel}
                >
                  <Text style={styles.primaryText}>{view.primary.label}</Text>
                </ScalePress>
              </View>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  dim: {
    position: 'absolute',
    backgroundColor: DIM,
  },
  ring: {
    position: 'absolute',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: RING,
  },
  cardArea: {
    position: 'absolute',
    left: SCREEN_MARGIN,
    right: SCREEN_MARGIN,
    alignItems: 'center',
  },
  cardAreaCenter: {
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fffdf7',
    borderRadius: 22,
    padding: 20,
    gap: 8,
    shadowColor: '#0a1220',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  position: {
    fontFamily: font.bold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: '#8a6d1d',
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: font.extraBold,
    fontSize: 20,
    color: '#1a2b44',
  },
  body: {
    fontFamily: font.regular,
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
  },
  navActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginLeft: 'auto',
  },
  skipButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  skipText: {
    fontFamily: font.semiBold,
    fontSize: 14,
    color: '#64748b',
  },
  secondaryButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 43, 68, 0.08)',
  },
  secondaryText: {
    fontFamily: font.bold,
    fontSize: 14,
    color: '#1a2b44',
  },
  primaryButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 20,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a2b44',
  },
  primaryText: {
    fontFamily: font.bold,
    fontSize: 14,
    color: '#f2c14e',
  },
});
