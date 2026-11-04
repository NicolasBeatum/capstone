import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LiquidBackground } from '@/shared/components/Glass';
import { AuthActionButton } from '@/shared/components/AuthActionButton';
import {
  BookIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentIcon,
  EyeIcon,
  EyeOffIcon,
  GradCapIcon,
  LockIcon,
} from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import {
  getAuthenticationErrorMessage,
  registerAccount,
} from '@/features/auth/application/authentication';
import { supabaseAuthGateway } from '@/features/auth/infrastructure/supabaseAuthGateway';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { Reveal } from '@/shared/motion/Reveal';
import { warmPalette } from '@/shared/theme/warmPalette';
import { ConsentCheckbox } from '../components/ConsentCheckbox';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { RegisterSection } from '../components/RegisterSection';
import { RegisterTextField } from '../components/RegisterTextField';
import { SelectField } from '../components/SelectField';
import { useRegistrationCatalog } from '../application/useRegistrationCatalog';
import { careerOptions, semesterOptions, validateAcademicSelection } from '../domain/registration';
import {
  REGISTER_BLOCKER_HINTS,
  REGISTER_CONSENT_LABELS,
  passwordStrength,
  registerBlocker,
} from '../domain/registerForm';
import { consentStore } from '@/shared/consents/infrastructure/consentStorage';
import { openPrivacyPolicy } from '@/shared/consents/infrastructure/privacyPolicyDocument';
import { rememberRegistrationConsents } from '../application/registrationConsents';
import { styles } from './registerForm.styles';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [careerId, setCareerId] = useState<string | null>(null);
  const [semester, setSemester] = useState<number | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  // Consentimientos opcionales: siempre parten desmarcados.
  const [shareAnonymousData, setShareAnonymousData] = useState(false);
  const [allowEmergencyContact, setAllowEmergencyContact] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const catalog = useRegistrationCatalog();
  const [feedback, setFeedback] = useState<{ message: string; tone: 'error' | 'success' } | null>(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const strength = passwordStrength(password);
  const blocker = registerBlocker({ email, password, confirmPassword, careerId, semester, acceptTerms });
  const confirmError =
    confirmPassword.length > 0 && confirmPassword !== password ? 'Las contraseñas no coinciden.' : null;

  const handleRegister = async () => {
    Keyboard.dismiss();
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
    if (strength.level !== 'strong') {
      setFeedback({ tone: 'error', message: 'Usa al menos 8 caracteres, un número, una mayúscula y un símbolo.' });
      return;
    }
    const selectionError = validateAcademicSelection({ careerId, semester }, catalog.careers);
    if (selectionError) {
      setFeedback({ tone: 'error', message: selectionError });
      return;
    }
    if (!acceptTerms) {
      setFeedback({ tone: 'error', message: 'Acepta los términos y la política de privacidad para crear la cuenta.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const destination = await registerAccount(email, password, supabaseAuthGateway);
      // Lo elegido se conserva en el dispositivo hasta que la persona complete su perfil.
      await rememberRegistrationConsents(consentStore, { shareAnonymousData, allowEmergencyContact });
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

  const handleOpenPolicy = async () => {
    try {
      await openPrivacyPolicy();
    } catch {
      setFeedback({ tone: 'error', message: 'No pudimos abrir el documento de consentimientos. Inténtalo de nuevo.' });
    }
  };

  const iconColor = warmPalette.textSecondary;

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
          {/* ── Encabezado ── */}
          <Reveal>
            <ScalePress
              style={styles.backButton}
              onPress={() => router.push('/login')}
              accessibilityRole="button"
              accessibilityLabel="Volver al inicio de sesión"
            >
              <ChevronLeftIcon size={22} color={warmPalette.navy} />
            </ScalePress>
            <Text style={styles.title} accessibilityRole="header">
              Crea tu cuenta
            </Text>
            <Text style={styles.subtitle}>Tu agenda y tu bienestar, en un solo lugar.</Text>
          </Reveal>

          {/* ── 1. Tu cuenta ── */}
          <Reveal index={1}>
            <RegisterSection step={1} title="Tu cuenta">
              <RegisterTextField
                label="Correo institucional"
                icon={<GradCapIcon size={20} color={iconColor} />}
                placeholder="tu.correo@duocuc.cl"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />

              <RegisterTextField
                label="Contraseña"
                icon={<LockIcon size={20} color={iconColor} />}
                placeholder="Crea una contraseña segura"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
                trailing={
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOffIcon size={22} color={iconColor} /> : <EyeIcon size={22} color={iconColor} />}
                  </TouchableOpacity>
                }
              />

              <PasswordStrengthMeter password={password} />

              <RegisterTextField
                label="Confirma tu contraseña"
                icon={<LockIcon size={20} color={iconColor} />}
                placeholder="Repite tu contraseña"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                error={confirmError}
              />
            </RegisterSection>
          </Reveal>

          {/* ── 2. Tu carrera ── */}
          <Reveal index={2}>
            <RegisterSection step={2} title="Tu carrera">
              {catalog.loading ? (
                <GotaLoader size="sm" text="Cargando carreras…" />
              ) : catalog.failed ? (
                <View>
                  <Text accessibilityLiveRegion="polite" style={styles.catalogError}>
                    No pudimos cargar las carreras. Revisa tu conexión e inténtalo de nuevo.
                  </Text>
                  <ScalePress
                    style={styles.retryButton}
                    onPress={catalog.reload}
                    accessibilityRole="button"
                    accessibilityLabel="Reintentar la carga de carreras"
                  >
                    <Text style={styles.retryText}>Reintentar</Text>
                  </ScalePress>
                </View>
              ) : (
                <>
                  <SelectField
                    label="Carrera"
                    placeholder="Elige tu carrera"
                    icon={<BookIcon size={20} color={iconColor} />}
                    options={careerOptions(catalog.careers)}
                    value={careerId}
                    onChange={setCareerId}
                  />
                  <SelectField
                    label="Semestre"
                    placeholder="Elige tu semestre"
                    icon={<CalendarIcon size={20} color={iconColor} />}
                    options={semesterOptions()}
                    value={semester === null ? null : String(semester)}
                    onChange={(key) => setSemester(Number(key))}
                  />
                </>
              )}
            </RegisterSection>
          </Reveal>

          {/* ── 3. Privacidad y consentimientos ── */}
          <Reveal index={3}>
            <RegisterSection step={3} title="Privacidad y consentimientos">
              {/* Enlace global: aplica a las tres casillas, no solo a la primera. */}
              <ScalePress
                style={styles.termsLink}
                onPress={handleOpenPolicy}
                accessibilityRole="link"
                accessibilityLabel="Leer términos, políticas y consentimientos. Aplica a las 3 opciones de abajo."
              >
                <View style={styles.termsLinkIcon}>
                  <DocumentIcon size={22} color={warmPalette.navy} />
                </View>
                <View style={styles.termsLinkBody}>
                  <Text style={styles.termsLinkTitle}>Leer términos, políticas y consentimientos</Text>
                  <Text style={styles.termsLinkScope}>Aplica a las 3 opciones de abajo</Text>
                </View>
                <ChevronRightIcon size={22} color={warmPalette.navy} />
              </ScalePress>

              <View style={styles.consentGroup}>
                <ConsentCheckbox
                  requirement="Obligatorio"
                  label={REGISTER_CONSENT_LABELS.terms}
                  checked={acceptTerms}
                  onToggle={() => setAcceptTerms(!acceptTerms)}
                />
                <ConsentCheckbox
                  requirement="Opcional"
                  label={REGISTER_CONSENT_LABELS.shareAnonymousData}
                  checked={shareAnonymousData}
                  onToggle={() => setShareAnonymousData(!shareAnonymousData)}
                />
                <ConsentCheckbox
                  requirement="Opcional"
                  label={REGISTER_CONSENT_LABELS.allowEmergencyContact}
                  checked={allowEmergencyContact}
                  onToggle={() => setAllowEmergencyContact(!allowEmergencyContact)}
                />
              </View>
            </RegisterSection>
          </Reveal>

          {/* ── Crear cuenta ── */}
          <Reveal index={4}>
            <AuthActionButton
              label="Crear cuenta"
              busyLabel="Creando cuenta…"
              isBusy={isSubmitting}
              disabled={blocker !== null}
              onPress={handleRegister}
              style={styles.primaryButton}
              disabledStyle={styles.primaryButtonDisabled}
              textStyle={styles.primaryButtonText}
              arrowStyle={styles.buttonArrow}
              accessibilityLabel="Crear cuenta"
            />

            {blocker ? (
              <Text accessibilityLiveRegion="polite" style={styles.blockerHint}>
                {REGISTER_BLOCKER_HINTS[blocker]}
              </Text>
            ) : null}

            {feedback ? (
              <Text
                accessibilityLiveRegion="polite"
                style={feedback.tone === 'error' ? styles.feedbackError : styles.feedbackSuccess}
              >
                {feedback.message}
              </Text>
            ) : null}

            {needsEmailConfirmation ? (
              <ScalePress
                style={styles.confirmationLoginButton}
                onPress={() => router.replace('/login')}
                accessibilityRole="button"
                accessibilityLabel="Ir a iniciar sesión"
              >
                <Text style={styles.confirmationLoginText}>Ir a iniciar sesión</Text>
              </ScalePress>
            ) : null}
          </Reveal>

          {/* ── Pie ── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
            <ScalePress
              style={styles.footerLinkButton}
              onPress={() => router.push('/login')}
              accessibilityRole="link"
              accessibilityLabel="Inicia sesión"
            >
              <Text style={styles.footerLink}>Inicia sesión</Text>
            </ScalePress>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
