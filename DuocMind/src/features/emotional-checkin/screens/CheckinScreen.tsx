import React, { useEffect, useRef, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
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
import { MoodLabel } from '../components/MoodLabel';
import { SaveOverlay } from '../components/SaveOverlay';
import { MoodSlider } from '../components/MoodSlider';
import { MOOD_MAX, clampMoodValue, moodFromValue, valueFromMood } from '../domain/moodScale';
import { styles } from './CheckinScreen.styles';

type SaveState = 'idle' | 'saving' | 'saved' | 'saved-offline';

// El guardado local es casi instantáneo; la gota se deja ver un momento para que el cierre se sienta calmado.
const MIN_SAVING_FEEDBACK_MS = 2200;
// Tiempo que se lee el agradecimiento antes de llevar a la persona al inicio.
const THANKS_VISIBLE_MS = 3200;

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

  const mood = moodFromValue(moodValue);
  // El Brote ocupa el centro sin empujar la barra ni el botón fuera de la pantalla.
  const faceSize = Math.min(width * 0.62, height * 0.34, 300);
  const broteSize = faceSize * 0.78;

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

  const goToDashboard = () => {
    clearTimeout(redirectTimer.current);
    router.replace('/dashboard');
  };

  const handleSave = async () => {
    if (saveState !== 'idle') return;
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
      const result = await saveConfirmedCheckin(mood, {
        local,
        remote: supabaseCheckinGateway,
        createRequestId: Crypto.randomUUID,
        now: () => new Date(),
      });
      await keepLoaderVisible();
      setSaveState(result.syncStatus === 'synced' ? 'saved' : 'saved-offline');
      // Tras el agradecimiento se va al inicio para que no se registre de nuevo por error.
      redirectTimer.current = setTimeout(goToDashboard, THANKS_VISIBLE_MS);
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

      <View style={styles.content}>
        <Reveal style={styles.header}>
          <Text style={styles.title}>¿Cómo te sientes hoy?</Text>
          <Text style={styles.subtitle}>Mueve la barra hasta encontrar tu estado</Text>
        </Reveal>

        <Reveal index={1} style={styles.faceArea}>
          <Brote t={clampMoodValue(moodValue) / MOOD_MAX} size={broteSize} />
          <MoodLabel text={mood} style={styles.moodLabel} />
        </Reveal>

        <Reveal index={2} style={styles.sliderArea}>
          <MoodSlider value={moodValue} onChange={handleMoodChange} />
        </Reveal>

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
      </View>

      <BottomNav currentTab="checkin" />

      {showOverlay ? (
        <SaveOverlay
          phase={saveState === 'saving' ? 'saving' : 'thanks'}
          t={clampMoodValue(moodValue) / MOOD_MAX}
          savedOffline={saveState === 'saved-offline'}
          onContinue={goToDashboard}
        />
      ) : null}
    </View>
  );
}
