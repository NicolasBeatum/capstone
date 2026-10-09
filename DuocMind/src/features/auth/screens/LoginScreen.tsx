import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LiquidBackground, LiquidCard } from '@/shared/components/Glass';
import { AuthActionButton } from '@/shared/components/AuthActionButton';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { Reveal } from '@/shared/motion/Reveal';
import { getAuthenticationErrorMessage, loginAccount } from '@/features/auth/application/authentication';
import { supabaseAuthGateway } from '@/features/auth/infrastructure/supabaseAuthGateway';
import {
  EyeIcon,
  EyeOffIcon,
  LeafIcon,
  LockIcon,
  MailIcon,
  ShieldIcon,
  SparkleIcon,
} from '@/shared/components/Icons';
import { styles } from './authForm.styles';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; tone: 'error' | 'success' } | null>(null);

  const handleLogin = async () => {
    setFeedback(null);
    if (!email || !password) {
      setFeedback({ tone: 'error', message: 'Ingresa tu correo y contraseña.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const destination = await loginAccount(email, password, supabaseAuthGateway);
      // La gota sigue visible hasta que la pantalla de destino reemplaza al login.
      if (destination === 'profile') {
        router.replace('/profile');
      } else {
        router.replace({ pathname: '/dashboard', params: { welcome: '1' } });
      }
    } catch (error) {
      setFeedback({ tone: 'error', message: getAuthenticationErrorMessage(error) });
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setFeedback(null);
    if (!email.trim()) {
      setFeedback({ tone: 'error', message: 'Ingresa tu correo para solicitar la recuperación.' });
      return;
    }

    try {
      await supabaseAuthGateway.requestPasswordReset(email.trim());
      setFeedback({ tone: 'success', message: 'Si la cuenta existe, recibirás un enlace de recuperación.' });
    } catch (error) {
      setFeedback({ tone: 'error', message: getAuthenticationErrorMessage(error) });
    }
  };

  return (
    <View style={styles.safeArea}>
      <LiquidBackground />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Bienvenida ── */}
          <View style={styles.hero}>
            <View style={styles.heroIconCircle}>
              <LeafIcon size={28} color="#9aa55c" />
            </View>
            <Text style={styles.heroTitle}>Bienvenido de nuevo</Text>
            <Text style={styles.heroSubtitle}>
              Tu espacio para cultivar serenidad y rendimiento académico.
            </Text>
            <View style={styles.badgePill}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>Pausa consciente • Enfoque sereno</Text>
              <SparkleIcon size={9} color="#d4b43c" />
            </View>
          </View>

          {/* ── Formulario ── */}
          <LiquidCard style={styles.formCard}>
            {/* Campo Correo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo institucional</Text>
              <View style={styles.inputContainer}>
                <MailIcon size={17} color="#b0a891" />
                <TextInput
                  style={styles.input}
                  placeholder="ejemplo@universidad.edu"
                  placeholderTextColor="#b0a891"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Campo Contraseña */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Contraseña</Text>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <LockIcon size={17} color="#b0a891" />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#b0a891"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Inicio de sesión */}
            <AuthActionButton
              label="Iniciar Sesión"
              busyLabel="Ingresando…"
              isBusy={isSubmitting}
              onPress={handleLogin}
              style={styles.primaryButton}
              textStyle={styles.primaryButtonText}
              arrowStyle={styles.buttonArrow}
            />

            {feedback ? (
              <Text
                accessibilityLiveRegion="polite"
                style={feedback.tone === 'error' ? styles.feedbackError : styles.feedbackSuccess}
              >
                {feedback.message}
              </Text>
            ) : null}
          </LiquidCard>

          {/* ── Enlace a Registro ── */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              ¿No tienes cuenta?{' '}
              <Text
                style={styles.footerLink}
                onPress={() => router.push('/register')}
              >
                Regístrate aquí
              </Text>
            </Text>
            <View style={styles.securityBadge}>
              <ShieldIcon size={13} color="#b0a891" />
              <Text style={styles.securityText}>
                Entorno protegido y libre de distracciones
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {isSubmitting ? (
        <Reveal style={styles.loadingOverlay}>
          <LiquidBackground />
          <GotaLoader size="lg" text="Ingresando a tu espacio…" />
        </Reveal>
      ) : null}
    </View>
  );
}
