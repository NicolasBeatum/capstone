import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthActionButton } from '@/shared/components/AuthActionButton';
import { LiquidBackground, LiquidCard } from '@/shared/components/Glass';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { ScalePress } from '@/shared/components/ScalePress';
import { formatDeletionDate } from '@/shared/deletion/application/scheduledDeletion';
import { supabaseDeletionGateway } from '@/shared/deletion/infrastructure/supabaseDeletionGateway';
import { getAuthenticationErrorMessage } from '../application/authentication';
import { supabaseAuthGateway } from '../infrastructure/supabaseAuthGateway';
import { styles } from './authForm.styles';

/**
 * Se muestra al iniciar sesión con una eliminación de cuenta pendiente: la persona decide
 * si la cancela y vuelve a la app, o sale y la eliminación sigue su curso.
 */
export default function AccountDeletionScreen() {
  const router = useRouter();
  const [executesAt, setExecutesAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void supabaseDeletionGateway
      .status()
      .then((status) => {
        if (!active) return;
        // Sin eliminación pendiente no hay nada que decidir aquí.
        if (!status.account) router.replace('/dashboard');
        else setExecutesAt(status.account);
      })
      .catch(() => active && setFeedback('No pudimos consultar tu cuenta. Revisa tu conexión e inténtalo de nuevo.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [router]);

  const handleCancel = async () => {
    setBusy(true);
    setFeedback(null);
    try {
      await supabaseAuthGateway.cancelAccountDeletion();
      router.replace((await supabaseAuthGateway.hasStudentProfile()) ? '/dashboard' : '/profile');
    } catch (error) {
      setFeedback(getAuthenticationErrorMessage(error));
      setBusy(false);
    }
  };

  const handleExit = async () => {
    setBusy(true);
    try {
      await supabaseAuthGateway.signOut();
    } catch {
      // Aunque falle, se vuelve al inicio de sesión: la eliminación sigue pendiente.
    }
    router.replace('/login');
  };

  return (
    <View style={styles.safeArea}>
      <LiquidBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.introEyebrow}>ELIMINACIÓN PENDIENTE</Text>
          <Text style={styles.introTitle}>Tu cuenta se va a eliminar</Text>
        </View>

        <LiquidCard style={styles.formCard}>
          {loading ? (
            <GotaLoader size="sm" text="Consultando tu cuenta…" />
          ) : executesAt ? (
            <>
              <Text style={styles.introSubtitle}>
                Pediste eliminar tu cuenta. El {formatDeletionDate(executesAt)} se borrarán tu cuenta y todos tus datos,
                también los de este teléfono. Mientras tanto no se usan en estadísticas ni los ve el equipo de Bienestar.
              </Text>
              <Text style={styles.introSubtitle}>
                Si cambiaste de opinión, cancélala y recuperas todo, incluido tu horario.
              </Text>
              <AuthActionButton
                label="Cancelar eliminación"
                busyLabel="Cancelando…"
                isBusy={busy}
                onPress={handleCancel}
                style={styles.primaryButton}
                textStyle={styles.primaryButtonText}
                arrowStyle={styles.buttonArrow}
              />
            </>
          ) : null}

          {feedback ? (
            <Text accessibilityLiveRegion="polite" style={styles.feedbackError}>
              {feedback}
            </Text>
          ) : null}

          <ScalePress
            style={styles.confirmationLoginButton}
            onPress={handleExit}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Salir y mantener la eliminación"
          >
            <Text style={styles.confirmationLoginText}>Salir y mantener la eliminación</Text>
          </ScalePress>
        </LiquidCard>
      </ScrollView>
    </View>
  );
}
