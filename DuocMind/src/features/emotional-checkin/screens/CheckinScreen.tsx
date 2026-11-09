import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useRouter } from 'expo-router';
import * as Crypto from 'expo-crypto';
import {
  saveConfirmedCheckin,
  syncPendingCheckins,
} from '@/features/emotional-checkin/application/checkinHistory';
import { getLocalCheckinStore } from '@/features/emotional-checkin/infrastructure/encryptedCheckinDatabase';
import { supabaseCheckinGateway } from '@/features/emotional-checkin/infrastructure/supabaseCheckinGateway';
import { supabaseAuthGateway } from '@/features/auth/infrastructure/supabaseAuthGateway';
import { BottomNav } from '@/shared/components/BottomNav';
import { LiquidBackground } from '@/shared/components/Glass';
import { Brote } from '@/shared/components/Brote';
import { ScalePress } from '@/shared/components/ScalePress';
import { Reveal } from '@/shared/motion/Reveal';
import { motionDuration, motionEasing } from '@/shared/motion/motionTokens';
import { useReducedMotion } from '@/shared/motion/useReducedMotion';
import { notifyTutorialCheckinSaved } from '@/shared/tutorial/infrastructure/tutorialRuntime';
import type { CheckinMood } from '../application/localCheckinStore';
import { MoodLabel } from '../components/MoodLabel';
import { SaveOverlay } from '../components/SaveOverlay';
import { MoodSlider } from '../components/MoodSlider';
import { ReasonBubbles } from '../components/ReasonBubbles';
import { requiresReason, toggleReason } from '../domain/checkinReasons';
import { useCheckinReasons } from '../hooks/useCheckinReasons';
import { MOOD_MAX, clampMoodValue, moodFromValue, valueFromMood } from '../domain/moodScale';
import { styles } from './CheckinScreen.styles';

type SaveState = 'idle' | 'saving' | 'saved' | 'saved-offline';

// El guardado local es casi instantáneo; la gota se deja ver un momento para que el cierre se sienta calmado.
const MIN_SAVING_FEEDBACK_MS = 2200;
// Tiempo que se lee el agradecimiento antes de llevar a la persona al inicio.
// Mal y Muy mal llevan más texto y es el más importante de leer, así que se quedan un segundo más.
const THANKS_VISIBLE_MS: Record<CheckinMood, number> = {
  'Muy mal': 7200,
  Mal: 7200,
  Neutro: 6200,
  Bien: 6200,
  'Muy bien': 6200,
};

// Proporción del Brote respecto del área de la cara, antes y después de mostrar los motivos.
const BROTE_RATIO = 0.78;
const BROTE_RATIO_WITH_REASONS = 0.55;

/** Sube los check-ins que quedaron en la outbox cifrada mientras no había conexión. */
async function syncPendingInBackground(): Promise<void> {
  try {
    const userId = await supabaseAuthGateway.getCurrentUserId();
    if (!userId) return;
    const local = await getLocalCheckinStore(userId);
    await syncPendingCheckins(local, supabaseCheckinGateway);
  } catch {
    // La outbox cifrada conserva los registros hasta el siguiente intento.
  }
}

export default function CheckinScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [moodValue, setMoodValue] = useState(valueFromMood('Neutro'));
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [feedback, setFeedback] = useState<string | null>(null);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reasons = useCheckinReasons();
  const [selectedReasonIds, setSelectedReasonIds] = useState<number[]>([]);
  // Las burbujas aparecen la primera vez que la persona deja la barra en una emoción.
  const [moodChosen, setMoodChosen] = useState(false);
  const showReasons = moodChosen && reasons.length > 0;
  const reduceMotion = useReducedMotion();
  const broteRatioAnim = useRef(new Animated.Value(BROTE_RATIO)).current;
  const [broteRatio, setBroteRatio] = useState(BROTE_RATIO);

  const mood = moodFromValue(moodValue);
  // El Brote ocupa el centro sin empujar la barra ni el botón fuera de la pantalla;
  // se achica al aparecer los motivos para dejarles espacio.
  const faceSize = Math.min(width * 0.62, height * 0.34, 300);
  const broteSize = faceSize * broteRatio;

  useEffect(() => {
    const target = showReasons ? BROTE_RATIO_WITH_REASONS : BROTE_RATIO;
    if (reduceMotion) {
      broteRatioAnim.setValue(target);
      setBroteRatio(target);
      return;
    }
    const listener = broteRatioAnim.addListener(({ value }) => setBroteRatio(value));
    const animation = Animated.timing(broteRatioAnim, {
      toValue: target,
      duration: motionDuration.screen,
      easing: motionEasing.calm,
      useNativeDriver: false,
    });
    animation.start();
    return () => {
      animation.stop();
      broteRatioAnim.removeListener(listener);
    };
  }, [broteRatioAnim, reduceMotion, showReasons]);

  useEffect(() => {
    void syncPendingInBackground();
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) void syncPendingInBackground();
    });
    return () => {
      unsubscribe();
      clearTimeout(redirectTimer.current);
    };
  }, []);

  const handleMoodChange = (value: number) => {
    setMoodValue(value);
    setFeedback(null);
  };

  const handleReasonToggle = (id: number) => {
    setSelectedReasonIds((selected) => toggleReason(selected, id));
    setFeedback(null);
  };

  const goToDashboard = () => {
    clearTimeout(redirectTimer.current);
    router.replace('/dashboard');
  };

  const handleSave = async () => {
    if (saveState !== 'idle') return;
    // Si hay motivos disponibles, se exige al menos uno; sin catálogo se registra igual.
    if (requiresReason(reasons, selectedReasonIds)) {
      setMoodChosen(true);
      setFeedback('Elige al menos un motivo para registrar.');
      return;
    }
    setFeedback(null);
    setSaveState('saving');
    const startedAt = Date.now();
    const keepLoaderVisible = async () => {
      const remaining = MIN_SAVING_FEEDBACK_MS - (Date.now() - startedAt);
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
    };
    try {
      const userId = await supabaseAuthGateway.getCurrentUserId();
      if (!userId) {
        setFeedback('Inicia sesión para registrar cómo te sientes.');
        setSaveState('idle');
        return;
      }

      let profileReady = await supabaseAuthGateway.hasCachedStudentProfile();
      if (!profileReady) profileReady = await supabaseAuthGateway.hasStudentProfile();
      if (!profileReady) {
        setFeedback('Completa tus datos de estudiante antes de registrar.');
        setSaveState('idle');
        return;
      }

      const local = await getLocalCheckinStore(userId);
      // Solo se envían motivos que siguen en el catálogo mostrado.
      const reasonIds = selectedReasonIds.filter((id) => reasons.some((reason) => reason.id === id));
      const result = await saveConfirmedCheckin(
        mood,
        {
          local,
          remote: supabaseCheckinGateway,
          createRequestId: Crypto.randomUUID,
          now: () => new Date(),
        },
        reasonIds,
      );
      // El tutorial se entera de que el registro quedó guardado; no recibe la emoción.
      notifyTutorialCheckinSaved(userId);
      await keepLoaderVisible();
      setSaveState(result.syncStatus === 'synced' ? 'saved' : 'saved-offline');
      // Tras el agradecimiento se va al inicio para que no se registre de nuevo por error.
      redirectTimer.current = setTimeout(goToDashboard, THANKS_VISIBLE_MS[mood]);
    } catch {
      await keepLoaderVisible();
      setFeedback('No se pudo registrar. Revisa tu conexión e inténtalo de nuevo.');
      setSaveState('idle');
    }
  };

  const showOverlay = saveState !== 'idle';

  return (
    <View style={styles.safeArea}>
      <LiquidBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Reveal style={styles.header}>
          <Text style={styles.title}>¿Cómo te sientes hoy?</Text>
          <Text style={styles.subtitle}>Mueve la barra hasta encontrar tu estado</Text>
        </Reveal>

        <Reveal index={1} style={styles.faceArea}>
          <Brote t={clampMoodValue(moodValue) / MOOD_MAX} size={broteSize} />
          <MoodLabel text={mood} style={styles.moodLabel} />
        </Reveal>

        <Reveal index={2} style={styles.sliderArea}>
          <MoodSlider value={moodValue} onChange={handleMoodChange} onCommit={() => setMoodChosen(true)} />
        </Reveal>

        {showReasons ? (
          <ReasonBubbles reasons={reasons} selectedIds={selectedReasonIds} onToggle={handleReasonToggle} />
        ) : null}

        <Reveal index={3}>
          <ScalePress
            style={styles.registerButton}
            onPress={() => void handleSave()}
            disabled={saveState !== 'idle'}
            accessibilityRole="button"
            accessibilityLabel={`Registrar estado ${mood}`}
            accessibilityState={{ busy: saveState === 'saving', disabled: saveState !== 'idle' }}
          >
            <Text style={styles.registerText}>Registrar</Text>
          </ScalePress>
        </Reveal>

        <Text
          style={[styles.feedback, feedback ? styles.feedbackError : null]}
          accessibilityLiveRegion="polite"
        >
          {feedback ?? ' '}
        </Text>
      </ScrollView>

      <BottomNav currentTab="checkin" />

      {showOverlay ? (
        <SaveOverlay
          phase={saveState === 'saving' ? 'saving' : 'thanks'}
          t={clampMoodValue(moodValue) / MOOD_MAX}
          mood={mood}
          savedOffline={saveState === 'saved-offline'}
          onContinue={goToDashboard}
        />
      ) : null}
    </View>
  );
}
