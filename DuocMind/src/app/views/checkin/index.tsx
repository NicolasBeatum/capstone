import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import * as Crypto from 'expo-crypto';
import {
  deleteCheckin,
  loadCheckinHistory,
  saveConfirmedCheckin,
  syncPendingCheckins,
  type CheckinHistoryEntry,
} from '@/features/emotional-checkin/application/checkinHistory';
import { getLocalCheckinStore } from '@/features/emotional-checkin/infrastructure/encryptedCheckinDatabase';
import { supabaseCheckinGateway } from '@/features/emotional-checkin/infrastructure/supabaseCheckinGateway';
import { supabaseAuthGateway } from '@/features/auth/infrastructure/supabaseAuthGateway';
import { getSupabaseClient } from '@/features/backend/infrastructure/supabaseClient';
import { AuthActionButton } from '@/shared/components/AuthActionButton';
import { BottomNav } from '@/shared/components/BottomNav';
import { LiquidBackground, LiquidCard } from '@/shared/components/glass';
import { BellIcon, EmotionFace, LeafIcon } from '@/shared/components/icons';
import { styles } from '@/shared/styles/checkin.styles';

export type MoodType = 'Muy mal' | 'Mal' | 'Neutro' | 'Bien' | 'Muy bien';

const MOOD_OPTIONS: MoodType[] = ['Muy mal', 'Mal', 'Neutro', 'Bien', 'Muy bien'];
type HistoryStatus = 'loading' | 'ready' | 'unavailable' | 'signed-out' | 'profile-needed' | 'error';

function formatCheckinDate(value: string): string {
  return new Date(value).toLocaleString('es-CL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* Ánimos que activan el sondeo inicial de ánimo y ansiedad */
const isNegativeMood = (mood: MoodType) => mood === 'Muy mal' || mood === 'Mal';

export default function CheckinScreen() {
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<MoodType>('Bien');
  const [history, setHistory] = useState<CheckinHistoryEntry[]>([]);
  const [historyStatus, setHistoryStatus] = useState<HistoryStatus>('loading');
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [sondeoMood, setSondeoMood] = useState<MoodType | null>(null);

  const refreshHistory = async (trySync = false) => {
    try {
      const { data, error } = await getSupabaseClient().auth.getSession();
      if (error) throw error;
      const userId = data.session?.user.id;
      if (!userId) {
        setHistory([]);
        setHistoryStatus('signed-out');
        return;
      }

      let profileReady = await supabaseAuthGateway.hasCachedStudentProfile();
      if (!profileReady) profileReady = await supabaseAuthGateway.hasStudentProfile();
      if (!profileReady) {
        setHistory([]);
        setHistoryStatus('profile-needed');
        return;
      }

      const local = await getLocalCheckinStore(userId);
      if (trySync) {
        try {
          await syncPendingCheckins(local, supabaseCheckinGateway);
        } catch {
          // La outbox cifrada conserva los registros hasta el siguiente intento.
        }
      }
      const result = await loadCheckinHistory(local, supabaseCheckinGateway);
      setHistory(result.entries);
      setHistoryStatus(result.remoteAvailable ? 'ready' : 'unavailable');
    } catch {
      setHistoryStatus('error');
    }
  };

  useEffect(() => {
    let active = true;
    const load = async (trySync: boolean) => {
      await refreshHistory(trySync);
      if (!active) return;
    };

    void load(true);
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) void load(true);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const handleSave = async () => {
    setSaveFeedback(null);
    setSondeoMood(null);
    setIsSaving(true);
    try {
      const { data, error } = await getSupabaseClient().auth.getSession();
      if (error) throw error;
      const userId = data.session?.user.id;
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
      await saveConfirmedCheckin(selectedMood, {
        local,
        remote: supabaseCheckinGateway,
        createRequestId: Crypto.randomUUID,
        now: () => new Date(),
      });
      const historyResult = await loadCheckinHistory(local, supabaseCheckinGateway);
      setHistory(historyResult.entries);
      setHistoryStatus(historyResult.remoteAvailable ? 'ready' : 'unavailable');

      if (isNegativeMood(selectedMood)) setSondeoMood(selectedMood);
    } catch {
      setSaveFeedback('No se pudo confirmar el check-in. Revisa la conexión y que tu perfil esté completo, y vuelve a intentarlo.');
      void refreshHistory();
    } finally {
      setIsSaving(false);
    }
  };

  const requestDelete = (entry: CheckinHistoryEntry) => {
    Alert.alert('Eliminar registro', 'Este check-in se quitará de tu historial.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              const { data } = await getSupabaseClient().auth.getSession();
              const userId = data.session?.user.id;
              if (!userId) throw new Error('session');
              const local = await getLocalCheckinStore(userId);
              await deleteCheckin(entry.clientRequestId, { local, remote: supabaseCheckinGateway });
              const historyResult = await loadCheckinHistory(local, supabaseCheckinGateway);
              setHistory(historyResult.entries);
              setHistoryStatus(historyResult.remoteAvailable ? 'ready' : 'unavailable');
            } catch {
              Alert.alert('No se pudo eliminar', 'Inténtalo nuevamente cuando tengas conexión.');
            }
          })();
        },
      },
    ]);
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
          {/* ── Header: pregunta principal ── */}
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.greetingTitle}>¿Cómo te sientes hoy?</Text>
              <Text style={styles.greetingSubtitle}>Espacio de autoobservación</Text>
            </View>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>CM</Text>
            </View>
            <TouchableOpacity
              style={styles.bellButton}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Notificaciones"
            >
              <BellIcon size={20} />
              <View style={styles.bellDot} />
            </TouchableOpacity>
          </View>

          {/* ── Selector de ánimo ── */}
          <LiquidCard style={styles.moodCardContainer}>
            <View style={styles.moodCardDecoration}>
              <LeafIcon size={20} />
            </View>
            <View style={styles.moodGrid}>
              {MOOD_OPTIONS.map((mood) => {
                const isSelected = selectedMood === mood;
                return (
                  <TouchableOpacity
                    key={mood}
                    style={[styles.moodCard, isSelected && styles.moodCardSelected]}
                    onPress={() => setSelectedMood(mood)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={`Seleccionar estado ${mood}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={styles.moodIcon}>
                      <EmotionFace mood={mood} size={34} />
                    </View>
                    <Text
                      style={[
                        styles.moodLabel,
                        isSelected && styles.moodLabelSelected,
                      ]}
                    >
                      {mood}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </LiquidCard>

          {/* ── Botón confirmar ── */}
          <AuthActionButton
            label="Confirmar respuesta"
            busyLabel="Guardando…"
            isBusy={isSaving}
            onPress={handleSave}
            style={styles.saveButton}
            textStyle={styles.saveButtonText}
            arrowStyle={styles.saveButtonArrow}
          />

          {saveFeedback ? (
            <Text
              accessibilityLiveRegion="polite"
              style={styles.checkinFeedbackError}
            >
              {saveFeedback}
            </Text>
          ) : null}

          {sondeoMood ? (
            <TouchableOpacity
              style={styles.surveyButton}
              onPress={() => router.push(`/views/tests/daily-test?mood=${encodeURIComponent(sondeoMood)}`)}
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <Text style={styles.surveyButtonText}>Realizar sondeo de ánimo y ansiedad</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Tu historial</Text>
              {historyStatus === 'loading' && <Text style={styles.historyHint}>Cargando</Text>}
              {historyStatus === 'unavailable' && <Text style={styles.historyHint}>No disponible</Text>}
            </View>
            {historyStatus === 'signed-out' ? (
              <>
                <Text style={styles.historyEmpty}>Inicia sesión para consultar tus registros.</Text>
                <TouchableOpacity
                  onPress={() => router.push('/views/auth/login')}
                  style={styles.historyLoginLink}
                  accessibilityRole="button"
                >
                  <Text style={styles.historyLoginText}>Iniciar sesión</Text>
                </TouchableOpacity>
              </>
            ) : historyStatus === 'profile-needed' ? (
              <Text style={styles.historyEmpty}>Completa tu perfil para habilitar el historial.</Text>
            ) : historyStatus === 'error' ? (
              <Text style={styles.historyEmpty}>No se pudo cargar el historial.</Text>
            ) : history.length === 0 && historyStatus === 'ready' ? (
              <Text style={styles.historyEmpty}>Aún no tienes check-ins registrados.</Text>
            ) : history.length === 0 && historyStatus === 'unavailable' ? (
              <Text style={styles.historyEmpty}>No se pudo consultar tu historial en este momento.</Text>
            ) : (
              history.map((entry) => (
                <View key={entry.clientRequestId} style={styles.historyItem}>
                  <View style={styles.historyItemText}>
                    <Text style={styles.historyMood}>{entry.mood}</Text>
                    <Text style={styles.historyDate}>{formatCheckinDate(entry.createdAt)}</Text>
                    <Text style={styles.historySync}>
                      {entry.syncStatus === 'synced' ? 'Enviado a Supabase' : 'Pendiente de envío'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => requestDelete(entry)}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar check-in ${entry.mood} del ${formatCheckinDate(entry.createdAt)}`}
                  >
                    <Text style={styles.deleteButtonText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Navegación Inferior */}
        <BottomNav currentTab="checkin" />
      </View>
    </KeyboardAvoidingView>
  );
}
