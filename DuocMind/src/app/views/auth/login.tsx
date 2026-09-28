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
import { AuthActionButton } from '@/shared/components/AuthActionButton';
import {
  getAuthenticationErrorMessage,
  loginAccount,
} from '@/features/auth/application/authentication';
import { supabaseAuthGateway } from '@/features/auth/infrastructure/supabaseAuthGateway';
import { styles } from '@/shared/styles/login.styles';

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
      router.replace(destination === 'profile' ? '/views/auth/profile' : '/views/dashboard');
    } catch (error) {
      setFeedback({ tone: 'error', message: getAuthenticationErrorMessage(error) });
    } finally {
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.safeArea}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Banner de Bienvenida */}
        <View style={styles.bannerCard}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🌿</Text>
          </View>
          <Text style={styles.bannerTitle}>Bienvenido de nuevo</Text>
          <Text style={styles.bannerSubtitle}>
            Tu espacio para cultivar serenidad y rendimiento académico.
          </Text>
          <View style={styles.badgePill}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Pausa consciente • Enfoque sereno</Text>
          </View>
        </View>

        {/* Tarjeta de Formulario */}
        <View style={styles.formCard}>
          {/* Campo Correo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo institucional</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLeadingIcon}>✉</Text>
              <TextInput
                style={styles.input}
                placeholder="ejemplo@universidad.edu"
                placeholderTextColor="#94a3b8"
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
              <Text style={styles.inputLeadingIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁' : '🙈'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Botón de Inicio */}
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
        </View>

        {/* Enlace a Registro */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            ¿No tienes cuenta?{' '}
            <Text
              style={styles.registerLink}
              onPress={() => router.push('/views/auth/register')}
            >
              Regístrate aquí
            </Text>
          </Text>
          <View style={styles.securityBadge}>
            <Text style={styles.shieldIcon}>🛡</Text>
            <Text style={styles.securityText}>
              Entorno protegido y libre de distracciones
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
