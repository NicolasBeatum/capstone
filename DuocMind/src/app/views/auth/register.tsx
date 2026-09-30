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
  registerAccount,
} from '@/features/auth/application/authentication';
import { supabaseAuthGateway } from '@/features/auth/infrastructure/supabaseAuthGateway';
import { styles } from '@/shared/styles/register.styles';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; tone: 'error' | 'success' } | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const handleRegister = async () => {
    setFeedback(null);
    setNeedsEmailConfirmation(false);
    if (!email || !password || !confirmPassword) {
      setFeedback({ tone: 'error', message: 'Completa todos los campos para continuar.' });
      return;
    }
    if (password !== confirmPassword) {
      setFeedback({ tone: 'error', message: 'Las contraseñas no coinciden.' });
      return;
    }
    if (!hasMinLength || !hasNumber || !hasUppercase || !hasSymbol) {
      setFeedback({ tone: 'error', message: 'Usa al menos 8 caracteres, un número, una mayúscula y un símbolo.' });
      return;
    }
    if (!acceptTerms) {
      setFeedback({ tone: 'error', message: 'Acepta los términos y la política de privacidad para crear la cuenta.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const destination = await registerAccount(email, password, supabaseAuthGateway);
      if (destination === 'profile') {
        router.replace('/views/auth/profile');
      } else {
        setNeedsEmailConfirmation(true);
        setFeedback({
          tone: 'success',
          message: 'Solicitud recibida. Si el correo puede registrarse, recibirás un enlace para confirmarlo. Después inicia sesión para completar tu perfil.',
        });
      }
    } catch (error) {
      setFeedback({ tone: 'error', message: getAuthenticationErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

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
        {/* Barra superior */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/views/auth/login')}
            accessibilityLabel="Volver al inicio de sesión"
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>CREAR CUENTA</Text>
          <View style={styles.topBarSpacer} />
        </View>

        {/* Tarjeta de Bienvenida */}
        <View style={styles.welcomeCard}>
          <View style={styles.badgePill}>
            <Text style={styles.badgeIcon}>🌿</Text>
            <Text style={styles.badgeText}>Espacio Sereno</Text>
          </View>
          <Text style={styles.welcomeTitle}>Crea tu Cuenta</Text>
          <Text style={styles.welcomeSubtitle}>
            Empieza a balancear tu vida académica y emocional hoy mismo.
          </Text>
        </View>

        {/* Micro-banner de comunidad */}
        <View style={styles.communityBanner}>
          <View style={styles.communityIconContainer}>
            <Text style={styles.communityIcon}>🎓</Text>
          </View>
          <View style={styles.communityTextContainer}>
            <Text style={styles.communityTitle}>Comunidad Consciente</Text>
            <Text style={styles.communitySubtitle}>
              Únete a más de 12,000 estudiantes que priorizan su bienestar.
            </Text>
          </View>
        </View>

        {/* Formulario de Registro */}
        <View style={styles.formCard}>
          {/* Correo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo Electrónico Institucional</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLeadingIcon}>🎓</Text>
              <TextInput
                style={styles.input}
                placeholder="tu.correo@universidad.edu"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLeadingIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Crea una contraseña segura"
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

            {/* Checklist de requisitos de contraseña */}
            <View style={styles.strengthBox}>
              <View style={styles.strengthHeader}>
                <Text style={styles.strengthLabel}>Fortaleza de seguridad</Text>
                <Text style={styles.strengthStatus}>
                  {hasMinLength && hasNumber && hasUppercase && hasSymbol ? 'Buena' : 'En progreso'}
                </Text>
              </View>
              <View style={styles.strengthBarBg}>
                <View
                  style={[
                    styles.strengthBarFill,
                    {
                      width: `${
                        ([hasMinLength, hasNumber, hasUppercase, hasSymbol].filter(Boolean).length /
                          4) *
                        100
                      }%`,
                    },
                  ]}
                />
              </View>

              <View style={styles.reqGrid}>
                <View style={styles.reqItem}>
                  <Text style={[styles.reqIcon, hasMinLength && styles.reqPassed]}>
                    {hasMinLength ? '✓' : '○'}
                  </Text>
                  <Text style={[styles.reqText, hasMinLength && styles.reqPassedText]}>
                    Mínimo 8 carac.
                  </Text>
                </View>
                <View style={styles.reqItem}>
                  <Text style={[styles.reqIcon, hasNumber && styles.reqPassed]}>
                    {hasNumber ? '✓' : '○'}
                  </Text>
                  <Text style={[styles.reqText, hasNumber && styles.reqPassedText]}>
                    Un número
                  </Text>
                </View>
                <View style={styles.reqItem}>
                  <Text style={[styles.reqIcon, hasUppercase && styles.reqPassed]}>
                    {hasUppercase ? '✓' : '○'}
                  </Text>
                  <Text style={[styles.reqText, hasUppercase && styles.reqPassedText]}>
                    Una mayúscula
                  </Text>
                </View>
                <View style={styles.reqItem}>
                  <Text style={[styles.reqIcon, hasSymbol && styles.reqPassed]}>
                    {hasSymbol ? '✓' : '○'}
                  </Text>
                  <Text style={[styles.reqText, hasSymbol && styles.reqPassedText]}>
                    Un símbolo (@, #)
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Confirmar Contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmación de Contraseña</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLeadingIcon}>✓</Text>
              <TextInput
                style={styles.input}
                placeholder="Repite tu contraseña"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
          </View>

          {/* Checkbox Términos */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAcceptTerms(!acceptTerms)}
            activeOpacity={0.8}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptTerms }}
          >
            <View style={[styles.checkbox, acceptTerms && styles.checkboxActive]}>
              {acceptTerms && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              Acepto los términos de servicio y las políticas de privacidad de Equilibrio Académico.
            </Text>
          </TouchableOpacity>

          {/* Botón Crear Cuenta */}
          <AuthActionButton
            label="Crear Cuenta"
            busyLabel="Creando cuenta…"
            isBusy={isSubmitting}
            onPress={handleRegister}
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

          {needsEmailConfirmation ? (
            <TouchableOpacity
              style={styles.confirmationLoginButton}
              onPress={() => router.replace('/views/auth/login')}
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <Text style={styles.confirmationLoginText}>Ir a iniciar sesión</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            ¿Ya tienes una cuenta?{' '}
            <Text
              style={styles.loginLink}
              onPress={() => router.push('/views/auth/login')}
            >
              Inicia sesión
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
