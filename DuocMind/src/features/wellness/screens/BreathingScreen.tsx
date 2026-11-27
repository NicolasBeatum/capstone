import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { BottomNav } from '@/shared/components/BottomNav';
import { ChevronLeftIcon } from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import { Reveal } from '@/shared/motion/Reveal';
import { useReducedMotion } from '@/shared/motion/useReducedMotion';
import { SoundToggle } from '../components/SoundToggle';
import { ToolGuide } from '../components/ToolGuide';
import { BREATH_CYCLES, BREATH_PHASES, breathMomentAt, circleScale, type BreathKind } from '../domain/breathing478';
import { BREATHING_GUIDE_STEPS } from '../domain/breathingGuide';
import { useBreathingSounds } from '../hooks/useBreathingSounds';
import { hasSeenGuide, markGuideSeen } from '../infrastructure/guideStorage';
import { RING_SIZE, RING_STROKE, styles } from './BreathingScreen.styles';

type Status = 'idle' | 'running' | 'done';

const PHASE_COLORS: Record<BreathKind, string> = {
  inhale: '#e1e7f8',
  hold: '#f6e3b4',
  exhale: '#d6eadf',
};

const RADIUS = (RING_SIZE - RING_STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Respiración 4-7-8: herramienta local de la app, no viene de la base de datos. */
export default function BreathingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const [status, setStatus] = useState<Status>('idle');
  const [startedAt, setStartedAt] = useState(0);
  const [now, setNow] = useState(Date.now());

  // Guía: paso que se muestra (null = cerrada) y el círculo que resalta.
  const [guideStep, setGuideStep] = useState<number | null>(null);
  const circleRef = useRef<View>(null);
  const guideTargets = useMemo(() => ({ breathingCircle: circleRef }), []);

  // La primera vez que entra, mostramos la guía.
  useEffect(() => {
    void hasSeenGuide('breathing').then((seen) => {
      if (!seen) setGuideStep(0);
    });
  }, []);

  // Mientras corre, actualizamos seguido para que el círculo y el anillo se muevan suave.
  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(id);
  }, [status]);

  const moment = status === 'running' ? breathMomentAt((now - startedAt) / 1000) : null;

  // Cuando se acaban los 4 ciclos, terminamos.
  const finished = status === 'running' && moment === null;
  useEffect(() => {
    if (finished) setStatus('done');
  }, [finished]);

  // Sonidos guiados: el hook decide cuándo suenan; la pantalla solo le cuenta qué pasa.
  const { enabled: soundEnabled, setEnabled: setSoundEnabled } = useBreathingSounds({ status, moment });

  function start() {
    const current = Date.now();
    setStartedAt(current);
    setNow(current);
    setStatus('running');
  }

  function closeGuide() {
    setGuideStep(null);
    void markGuideSeen('breathing');
  }

  // Texto y color del círculo. Durante la guía mostramos de ejemplo la fase que se explica.
  const guideId = guideStep === null ? null : BREATHING_GUIDE_STEPS[guideStep].id;
  const guidePhase = BREATH_PHASES.find((phase) => phase.kind === GUIDE_TO_PHASE[guideId ?? '']);

  let label = 'Listo';
  let color = PHASE_COLORS.inhale;
  let scale = 0.8;
  let progress = 0;
  if (moment) {
    label = moment.phase.label;
    color = PHASE_COLORS[moment.phase.kind];
    scale = reduceMotion ? 1 : circleScale(moment);
    progress = moment.progress;
  } else if (guidePhase) {
    label = guidePhase.label;
    color = PHASE_COLORS[guidePhase.kind];
  } else if (status === 'done') {
    label = '¡Bien hecho!';
    color = PHASE_COLORS.exhale;
  }

  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: Math.max(24, insets.top + 12) }]}
          showsVerticalScrollIndicator={false}
        >
          <ScalePress
            style={styles.backButton}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/wellness'))}
            accessibilityRole="button"
            accessibilityLabel="Volver a Bienestar"
          >
            <ChevronLeftIcon size={22} />
          </ScalePress>

          <Reveal>
            <Text style={styles.eyebrow}>HERRAMIENTA</Text>
            <Text style={styles.title} accessibilityRole="header">
              Respiración 4-7-8
            </Text>
          </Reveal>

          {/* ── Círculo que guía, con el anillo de progreso alrededor ── */}
          <Reveal index={1}>
            <View style={styles.stage}>
              <View ref={circleRef} collapsable={false} style={styles.ringBox}>
                <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ringSvg}>
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RADIUS}
                    stroke="#e6dcc8"
                    strokeWidth={RING_STROKE}
                    fill="none"
                  />
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RADIUS}
                    stroke="#1a2b44"
                    strokeWidth={RING_STROKE}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${progress * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                    transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                  />
                </Svg>
                <View style={[styles.circle, { backgroundColor: color, transform: [{ scale }] }]} />
                <Text style={styles.circleLabel} accessibilityLiveRegion="polite">
                  {label}
                </Text>
              </View>

              <Text style={styles.cycle}>
                {moment ? `Ciclo ${moment.cycle} de ${BREATH_CYCLES}` : `${BREATH_CYCLES} ciclos · inhala, aguanta y exhala`}
              </Text>

              <SoundToggle enabled={soundEnabled} onChange={setSoundEnabled} />

              {status === 'running' ? (
                <ActionButton label="Detener" onPress={() => setStatus('idle')} />
              ) : (
                <ActionButton label={status === 'done' ? 'Repetir' : 'Comenzar'} onPress={start} primary />
              )}
            </View>
          </Reveal>
        </ScrollView>

        {/* Burbuja ? para volver a ver la guía */}
        <View style={styles.helpAnchor} pointerEvents="box-none">
          <ScalePress
            style={styles.helpBubble}
            onPress={() => setGuideStep(0)}
            accessibilityRole="button"
            accessibilityLabel="Ver la guía de respiración"
          >
            <Text style={styles.helpBubbleText}>?</Text>
          </ScalePress>
        </View>
      </View>

      <BottomNav currentTab="wellness" />
      <ToolGuide
        steps={BREATHING_GUIDE_STEPS}
        stepIndex={guideStep}
        targets={guideTargets}
        onChangeStep={setGuideStep}
        onClose={closeGuide}
      />
    </View>
  );
}

/** Qué fase mostrar en el círculo durante cada paso de la guía. */
const GUIDE_TO_PHASE: Record<string, BreathKind> = {
  inhala: 'inhale',
  aguanta: 'hold',
  exhala: 'exhale',
};

function ActionButton({ label, onPress, primary = false }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <ScalePress
      style={[styles.button, primary && styles.buttonPrimary]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={[styles.buttonText, primary && styles.buttonTextPrimary]}>{label}</Text>
    </ScalePress>
  );
}
