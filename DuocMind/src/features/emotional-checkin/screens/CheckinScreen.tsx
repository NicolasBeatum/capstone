import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View, useWindowDimensions } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
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
import { ScalePress } from '@/shared/components/ScalePress';
import { MoodFace } from '../components/MoodFace';
import { MoodSlider } from '../components/MoodSlider';
import { moodFromValue, valueFromMood } from '../domain/moodScale';
import { styles } from './CheckinScreen.styles';

type SaveState = 'idle' | 'saving' | 'saved' | 'saved-offline';

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
  const { width, height } = useWindowDimensions();
  const [moodValue, setMoodValue] = useState(valueFromMood('Neutro'));
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [feedback, setFeedback] = useState<string | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const mood = moodFromValue(moodValue);
  // La cara ocupa el centro sin empujar la barra ni el botón fuera de la pantalla.
  const faceSize = Math.min(width * 0.62, height * 0.34, 300);

  useEffect(() => {
    void syncPendingInBackground();
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) void syncPendingInBackground();
    });
    return () => {
      unsubscribe();
      clearTimeout(resetTimer.current);
    };
  }, []);

  const handleMoodChange = (value: number) => {
    setMoodValue(value);
    if (saveState === 'saved' || saveState === 'saved-offline') setSaveState('idle');
    setFeedback(null);
  };

  const handleSave = async () => {
    if (saveState === 'saving') return;
    setFeedback(null);
    setSaveState('saving');
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
      setSaveState(result.syncStatus === 'synced' ? 'saved' : 'saved-offline');
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setSaveState('idle'), 2600);
    } catch {
      setFeedback('No se pudo registrar. Revisa tu conexión e inténtalo de nuevo.');
      setSaveState('idle');
    }
  };

  const saved = saveState === 'saved' || saveState === 'saved-offline';

  return (
    <View style={styles.safeArea}>
      <LiquidBackground />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>¿Cómo te sientes hoy?</Text>
          <Text style={styles.subtitle}>Mueve la barra hasta encontrar tu estado</Text>
        </View>

        <View style={styles.faceArea}>
          <MoodFace value={moodValue} size={faceSize} />
          <Text style={styles.moodLabel} accessibilityLiveRegion="polite">
            {mood}
          </Text>
        </View>

        <View style={styles.sliderArea}>
          <MoodSlider value={moodValue} onChange={handleMoodChange} />
        </View>

        <ScalePress
          style={[styles.registerButton, saved && styles.registerButtonSaved]}
          onPress={() => void handleSave()}
          disabled={saveState === 'saving'}
          accessibilityRole="button"
          accessibilityLabel={`Registrar estado ${mood}`}
          accessibilityState={{ busy: saveState === 'saving', disabled: saveState === 'saving' }}
        >
          {saveState === 'saving' ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={[styles.registerText, saved && styles.registerTextSaved]}>
              {saved ? 'Registrado ✓' : 'Registrar'}
            </Text>
          )}
        </ScalePress>

        <Text
          style={[styles.feedback, feedback ? styles.feedbackError : null]}
          accessibilityLiveRegion="polite"
        >
          {feedback ??
            (saveState === 'saved-offline'
              ? 'Guardado en tu dispositivo; se enviará cuando tengas conexión.'
              : ' ')}
        </Text>
      </View>

      <BottomNav currentTab="checkin" />
    </View>
  );
}
