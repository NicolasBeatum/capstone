import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav } from '@/shared/components/BottomNav';
import { ChevronLeftIcon } from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import { Reveal } from '@/shared/motion/Reveal';
import {
  buildPhases,
  clampSetting,
  DEFAULT_CONFIG,
  formatTime,
  lastSessionMessage,
  LIMITS,
  type PomodoroConfig,
  type PomodoroSession,
} from '../domain/pomodoro';
import { ToolGuide } from '../components/ToolGuide';
import { POMODORO_GUIDE_STEPS } from '../domain/pomodoroGuide';
import { hasSeenGuide, markGuideSeen } from '../infrastructure/guideStorage';
import { loadLastSession, saveLastSession } from '../infrastructure/pomodoroStorage';
import { styles } from './PomodoroScreen.styles';

type Status = 'idle' | 'running' | 'paused' | 'done';

/** Temporizador Pomodoro: herramienta local de la app, no viene de la base de datos. */
export default function PomodoroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [config, setConfig] = useState<PomodoroConfig>(DEFAULT_CONFIG);
  const [lastSession, setLastSession] = useState<PomodoroSession | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [completedBlocks, setCompletedBlocks] = useState(0);
  const [endsAt, setEndsAt] = useState(0); // momento (ms) en que termina la fase actual
  const [pausedLeft, setPausedLeft] = useState(0); // segundos que quedaban al pausar
  const [now, setNow] = useState(Date.now());

  // Guía: paso que se muestra (null = cerrada) y las tarjetas que resalta.
  const [guideStep, setGuideStep] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<View>(null);
  const configRef = useRef<View>(null);
  const guideTargets = useMemo(() => ({ pomodoroTimer: timerRef, pomodoroConfig: configRef }), []);

  const phases = useMemo(() => buildPhases(config), [config]);
  const phase = phases[phaseIndex];

  // Al abrir, partimos desde la configuración de la última sesión.
  useEffect(() => {
    void loadLastSession().then((session) => {
      setLastSession(session);
      if (session) setConfig(session.config);
    });
    // La primera vez que entra, mostramos la guía.
    void hasSeenGuide('pomodoro').then((seen) => {
      if (!seen) openGuide();
    });
  }, []);

  function openGuide() {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setGuideStep(0);
  }

  function closeGuide() {
    setGuideStep(null);
    void markGuideSeen('pomodoro');
  }

  // Mientras corre, actualizamos la hora cada medio segundo para redibujar el reloj.
  useEffect(() => {
    if (status !== 'running') return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [status]);

  let secondsLeft = config.studyMinutes * 60;
  if (status === 'running') secondsLeft = (endsAt - now) / 1000;
  if (status === 'paused') secondsLeft = pausedLeft;
  if (status === 'done') secondsLeft = 0;

  // Cuando la fase llega a cero pasamos a la siguiente (o terminamos).
  const phaseOver = status === 'running' && secondsLeft <= 0;
  useEffect(() => {
    if (!phaseOver) return;
    const blocks = completedBlocks + (phase.kind === 'study' ? 1 : 0);
    setCompletedBlocks(blocks);
    if (phaseIndex + 1 < phases.length) startPhase(phaseIndex + 1);
    else finishSession(blocks, 'done');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseOver]);

  function startPhase(index: number) {
    const current = Date.now();
    setPhaseIndex(index);
    setEndsAt(current + phases[index].minutes * 60_000);
    setNow(current);
    setStatus('running');
  }

  function start() {
    setCompletedBlocks(0);
    startPhase(0);
  }

  function pause() {
    setPausedLeft((endsAt - Date.now()) / 1000);
    setStatus('paused');
  }

  function resume() {
    const current = Date.now();
    setEndsAt(current + pausedLeft * 1000);
    setNow(current);
    setStatus('running');
  }

  function finishSession(blocks: number, nextStatus: Status) {
    setStatus(nextStatus);
    setPhaseIndex(0);
    if (blocks === 0) return; // no pisamos el progreso anterior con una sesión vacía
    const session: PomodoroSession = {
      config,
      completedBlocks: blocks,
      studiedMinutes: blocks * config.studyMinutes,
      finishedAt: new Date().toISOString(),
    };
    setLastSession(session);
    void saveLastSession(session);
  }

  function change(key: keyof PomodoroConfig, direction: 1 | -1) {
    const step = LIMITS[key][2];
    setConfig((prev) => ({
      ...prev,
      [key]: clampSetting(key, prev[key] + direction * step),
    }));
    if (status === 'done') setStatus('idle');
  }

  const editable = status === 'idle' || status === 'done';
  const studyBlock = phases.slice(0, phaseIndex + 1).filter((p) => p.kind === 'study').length;
  const totalMinutes = config.studyMinutes * config.blocks + config.breakMinutes * (config.blocks - 1);

  let phaseLabel = `Listo para ${config.blocks} ${config.blocks === 1 ? 'bloque' : 'bloques'}`;
  if (status === 'running' || status === 'paused') {
    phaseLabel = phase.kind === 'study' ? `Estudio · bloque ${studyBlock} de ${config.blocks}` : 'Descanso';
  }
  if (status === 'done') phaseLabel = '¡Sesión completada!';

  // Durante el paso «Descanso» de la guía, el reloj se muestra en verde como ejemplo.
  const showingBreakStep = guideStep !== null && POMODORO_GUIDE_STEPS[guideStep].id === 'descanso';
  const isBreak = showingBreakStep || (phase.kind === 'break' && status !== 'idle');

  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <ScrollView
          ref={scrollRef}
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
              Pomodoro
            </Text>
          </Reveal>

          {/* ── Reloj ── */}
          <Reveal index={1}>
            <View ref={timerRef} collapsable={false} style={[styles.timerCard, isBreak && styles.timerCardBreak]}>
              <Text style={styles.phaseLabel}>{phaseLabel}</Text>
              <Text style={styles.time} accessibilityLiveRegion="polite">
                {formatTime(secondsLeft)}
              </Text>
              <View style={styles.buttons}>
                {editable ? <TimerButton label="Comenzar" onPress={start} primary /> : null}
                {status === 'running' ? <TimerButton label="Pausar" onPress={pause} primary /> : null}
                {status === 'paused' ? <TimerButton label="Continuar" onPress={resume} primary /> : null}
                {!editable ? (
                  <TimerButton label="Terminar" onPress={() => finishSession(completedBlocks, 'idle')} />
                ) : null}
              </View>
            </View>
          </Reveal>

          {/* ── Configuración ── */}
          <Reveal index={2}>
            <View ref={configRef} collapsable={false} style={styles.card}>
              <Text style={styles.cardTitle}>Tu configuración</Text>
              <Stepper
                label="Estudio"
                value={`${config.studyMinutes} min`}
                disabled={!editable}
                onChange={(d) => change('studyMinutes', d)}
              />
              <Stepper
                label="Descanso"
                value={`${config.breakMinutes} min`}
                disabled={!editable}
                onChange={(d) => change('breakMinutes', d)}
              />
              <Stepper
                label="Bloques"
                value={String(config.blocks)}
                disabled={!editable}
                onChange={(d) => change('blocks', d)}
              />
              <Text style={styles.total}>Duración total: {totalMinutes} min</Text>
            </View>
          </Reveal>

          <Reveal index={3}>
            <View style={styles.lastSession}>
              <Text style={styles.lastSessionText}>{lastSessionMessage(lastSession)}</Text>
            </View>
          </Reveal>
        </ScrollView>

        {/* Burbuja ? para volver a ver la guía */}
        <View style={styles.helpAnchor} pointerEvents="box-none">
          <ScalePress
            style={styles.helpBubble}
            onPress={openGuide}
            accessibilityRole="button"
            accessibilityLabel="Ver la guía del Pomodoro"
          >
            <Text style={styles.helpBubbleText}>?</Text>
          </ScalePress>
        </View>
      </View>

      <BottomNav currentTab="wellness" />
      <ToolGuide
        steps={POMODORO_GUIDE_STEPS} stepIndex={guideStep} targets={guideTargets} onChangeStep={setGuideStep} onClose={closeGuide} />
    </View>
  );
}

function TimerButton({ label, onPress, primary = false }: { label: string; onPress: () => void; primary?: boolean }) {
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

interface StepperProps {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (direction: 1 | -1) => void;
}

function Stepper({ label, value, disabled, onChange }: StepperProps) {
  return (
    <View style={[styles.stepper, disabled && styles.stepperDisabled]}>
      <Text style={styles.stepperLabel}>{label}</Text>
      <ScalePress
        style={styles.stepperButton}
        onPress={() => onChange(-1)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Bajar ${label}`}
      >
        <Text style={styles.stepperButtonText}>−</Text>
      </ScalePress>
      <Text style={styles.stepperValue}>{value}</Text>
      <ScalePress
        style={styles.stepperButton}
        onPress={() => onChange(1)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`Subir ${label}`}
      >
        <Text style={styles.stepperButtonText}>+</Text>
      </ScalePress>
    </View>
  );
}
