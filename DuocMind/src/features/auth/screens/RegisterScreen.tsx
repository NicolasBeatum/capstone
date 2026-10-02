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
import {
  EyeIcon,
  EyeOffIcon,
  GradCapIcon,
  LockIcon,
  MailIcon,
  SparkleIcon,
} from '@/shared/components/Icons';
import {
  getAuthenticationErrorMessage,
  registerAccount,
} from '@/features/auth/application/authentication';
import { supabaseAuthGateway } from '@/features/auth/infrastructure/supabaseAuthGateway';
import { styles } from './authForm.styles';

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

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const requirements = [
    { label: 'Mínimo 8 carac.', met: hasMinLength },
    { label: 'Un número', met: hasNumber },
    { label: 'Una mayúscula', met: hasUppercase },
    { label: 'Un símbolo (@, #)', met: hasSymbol },
  ];
  const metCount = requirements.filter((requirement) => requirement.met).length;

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
    if (metCount < requirements.length) {
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
        router.replace('/profile');
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
          {/* ── Barra superior ── */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push('/login')}
              accessibilityRole="button"
              accessibilityLabel="Volver al inicio de sesión"
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>CREAR CUENTA</Text>
            <View style={styles.topBarSpacer} />
          </View>

          {/* ── Bienvenida ── */}
          <View style={styles.intro}>
            <Text style={styles.introEyebrow}>ESPACIO SERENO</Text>
            <Text style={styles.introTitle}>Crea tu cuenta</Text>
            <Text style={styles.introSubtitle}>
              Empieza a balancear tu vida académica y emocional hoy mismo.
            </Text>
          </View>

          {/* ── Aviso de comunidad ── */}
          <View style={styles.insightBox}>
            <View style={styles.insightIcon}>
              <SparkleIcon size={16} color="#d4912c" />
            </View>
            <View style={styles.insightTextBox}>
              <Text style={styles.insightText}>
                <Text style={styles.insightStrong}>Comunidad Consciente:</Text> únete a más de
                12,000 estudiantes que priorizan su bienestar.
              </Text>
            </View>
          </View>

          {/* ── Formulario de registro ── */}
          <LiquidCard style={styles.formCard}>
            {/* Correo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo institucional</Text>
              <View style={styles.inputContainer}>
                <GradCapIcon size={17} color="#b0a891" />
                <TextInput
                  style={styles.input}
                  placeholder="tu.correo@universidad.edu"
                  placeholderTextColor="#b0a891"
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
                <LockIcon size={17} color="#b0a891" />
                <TextInput
                  style={styles.input}
                  placeholder="Crea una contraseña segura"
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

              {/* Checklist de requisitos de contraseña */}
              <View style={styles.strengthBox}>
                <View style={styles.strengthHeader}>
                  <Text style={styles.strengthLabel}>Fortaleza de seguridad</Text>
                  <Text style={styles.strengthStatus}>
                    {metCount === requirements.length ? 'Buena' : 'En progreso'}
                  </Text>
                </View>
                <View style={styles.strengthBarBg}>
                  <View
                    style={[
                      styles.strengthBarFill,
                      { width: `${(metCount / requirements.length) * 100}%` },
                    ]}
                  />
                </View>

                <View style={styles.reqGrid}>
                  {requirements.map((requirement) => (
                    <View key={requirement.label} style={styles.reqItem}>
                      <Text style={[styles.reqIcon, requirement.met && styles.reqPassed]}>
                        {requirement.met ? '✓' : '○'}
                      </Text>
                      <Text style={[styles.reqText, requirement.met && styles.reqPassedText]}>
                        {requirement.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Confirmar contraseña */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmación de contraseña</Text>
              <View style={styles.inputContainer}>
                <LockIcon size={17} color="#b0a891" />
                <TextInput
                  style={styles.input}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor="#b0a891"
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            {/* Términos */}
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

            {/* Crear cuenta */}
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
                onPress={() => router.replace('/login')}
                accessibilityRole="button"
                activeOpacity={0.8}
              >
                <Text style={styles.confirmationLoginText}>Ir a iniciar sesión</Text>
              </TouchableOpacity>
            ) : null}
          </LiquidCard>

          {/* ── Pie ── */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              ¿Ya tienes una cuenta?{' '}
              <Text style={styles.footerLink} onPress={() => router.push('/login')}>
                Inicia sesión
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
