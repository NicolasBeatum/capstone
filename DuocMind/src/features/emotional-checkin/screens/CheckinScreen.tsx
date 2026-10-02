import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import {
  saveConfirmedCheckin,
  syncPendingCheckins,
} from '@/features/emotional-checkin/application/checkinHistory';
import { getLocalCheckinStore } from '@/features/emotional-checkin/infrastructure/encryptedCheckinDatabase';
import { supabaseCheckinGateway } from '@/features/emotional-checkin/infrastructure/supabaseCheckinGateway';
import { supabaseAuthGateway } from '@/features/auth/infrastructure/supabaseAuthGateway';
import { AuthActionButton } from '@/shared/components/AuthActionButton';
import { BottomNav } from '@/shared/components/BottomNav';
import { FadeIn } from '@/shared/components/FadeIn';
import { LiquidBackground, LiquidCard } from '@/shared/components/Glass';
import { PopIn } from '@/shared/components/PopIn';
import { SplitText } from '@/shared/components/SplitText';
import { useReduceMotion } from '@/shared/components/useReduceMotion';
import { MoodFace } from '../components/MoodFace';
import { MoodSlider } from '../components/MoodSlider';
import { describeFace, moodFromValue } from '../domain/moodFace';
import { styles } from './CheckinScreen.styles';

/* Punto de partida neutro para no inducir una respuesta */
const INITIAL_LEVEL = 2;

export default function CheckinScreen() {
  const reduceMotion = useReduceMotion();
  const value = useRef(new Animated.Value(INITIAL_LEVEL)).current;
  const [level, setLevel] = useState(INITIAL_LEVEL);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const mood = moodFromValue(level);
  const face = describeFace(level);

  /* El rostro y el deslizador comparten un solo valor animado */
  useEffect(() => {
    const id = value.addListener(({ value: current }) => setLevel(current));
    return () => value.removeListener(id);
  }, [value]);

  /* Respiración suave del halo detrás del rostro */
  const breath = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) return undefined;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [breath, reduceMotion]);

  /* Los check-ins pendientes se envían en segundo plano al recuperar conexión;
   * la outbox cifrada los conserva hasta el siguiente intento. */
  useEffect(() => {
    const syncPending = async () => {
      try {
        const userId = await supabaseAuthGateway.getCurrentUserId();
        if (!userId) return;
        if (!(await supabaseAuthGateway.hasCachedStudentProfile())) return;
        await syncPendingCheckins(await getLocalCheckinStore(userId), supabaseCheckinGateway);
      } catch {
        // Se reintenta en la siguiente reconexión.
      }
    };

    void syncPending();
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) void syncPending();
    });
    return unsubscribe;
  }, []);

  const handleSliderStart = () => {
    setSaved(false);
    setSaveFeedback(null);
  };

  const handleSave = async () => {
    setSaveFeedback(null);
    setSaved(false);
    setIsSaving(true);
    try {
      const userId = await supabaseAuthGateway.getCurrentUserId();
      if (!userId) {
        setSaveFeedback('Inicia sesión para guardar tu check-in personal.');
        return;
      }

      let profileReady = await supabaseAuthGateway.hasCachedStudentProfile();
      if (!profileReady) profileReady = await supabaseAuthGateway.hasStudentProfile();
      if (!profileReady) {
        setSaveFeedback('Completa tus datos de estudiante antes de guardar el check-in.');
        return;
      }

      const local = await getLocalCheckinStore(userId);
      await saveConfirmedCheckin(mood, {
        local,
        remote: supabaseCheckinGateway,
        createRequestId: Crypto.randomUUID,
        now: () => new Date(),
      });
      setSaved(true);
    } catch {
      setSaveFeedback(
        'No se pudo confirmar el check-in. Revisa la conexión y que tu perfil esté completo, y vuelve a intentarlo.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.safeArea}
    >
      <View style={styles.container}>
        <LiquidBackground />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Pregunta ── */}
          <View style={styles.header}>
            <SplitText text="¿Cómo te sientes hoy?" style={styles.title} align="center" />
            <FadeIn delay={500} offset={8}>
              <Text style={styles.subtitle}>Desliza para elegir cómo te sientes</Text>
            </FadeIn>
          </View>

          {/* ── Rostro que reacciona al deslizador ── */}
          <FadeIn delay={250} duration={600}>
            <View
              style={styles.faceStage}
              accessible
              accessibilityRole="image"
              accessibilityLabel={`Rostro que expresa: ${mood}`}
            >
              <Animated.View
                style={[
                  styles.halo,
                  {
                    backgroundColor: face.fill,
                    transform: [
                      { scale: breath.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.04] }) },
                    ],
                  },
                ]}
              />
              <MoodFace value={level} size={190} />
            </View>
          </FadeIn>

          <View style={styles.moodLabelWrap}>
            <FadeIn key={mood} duration={220} offset={8}>
              <Text style={styles.moodLabel}>{mood}</Text>
            </FadeIn>
          </View>

          {/* ── Deslizador ── */}
          <FadeIn delay={400}>
            <LiquidCard style={styles.sliderCard}>
              <MoodSlider
                value={value}
                level={level}
                color={face.fill}
                onChangeStart={handleSliderStart}
              />
            </LiquidCard>
          </FadeIn>

          {/* ── Confirmar ── */}
          <FadeIn delay={550}>
            <AuthActionButton
              label="Confirmar respuesta"
              busyLabel="Guardando…"
              isBusy={isSaving}
              onPress={handleSave}
              style={styles.saveButton}
              textStyle={styles.saveButtonText}
              arrowStyle={styles.saveButtonArrow}
            />
          </FadeIn>

          {saved ? (
            <PopIn style={styles.savedMessage}>
              <Text accessibilityLiveRegion="polite" style={styles.savedText}>
                ¡Listo! Registramos tu check-in
              </Text>
              <Text style={styles.savedHint}>Gracias por tomarte un momento para ti</Text>
            </PopIn>
          ) : null}

          {saveFeedback ? (
            <Text accessibilityLiveRegion="polite" style={styles.checkinFeedbackError}>
              {saveFeedback}
            </Text>
          ) : null}
        </ScrollView>

        {/* Navegación Inferior */}
        <BottomNav currentTab="checkin" />
      </View>
    </KeyboardAvoidingView>
  );
}
