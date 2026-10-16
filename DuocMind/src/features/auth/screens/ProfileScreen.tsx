import React, { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LiquidBackground, LiquidCard } from '@/shared/components/Glass';
import { AuthActionButton } from '@/shared/components/AuthActionButton';
import { CheckIcon, ShieldIcon, TicketIcon } from '@/shared/components/Icons';
import { Reveal } from '@/shared/motion/Reveal';
import {
  completeStudentProfile,
  getAuthenticationErrorMessage,
} from '@/features/auth/application/authentication';
import { StudentCredential } from '@/features/auth/components/StudentCredential';
import {
  FIRST_NAME_MAX_LENGTH,
  LAST_NAME_MAX_LENGTH,
  sanitizePersonName,
} from '@/features/auth/domain/personName';
import { formatRut, isRutComplete } from '@/features/auth/domain/rut';
import { supabaseAuthGateway } from '@/features/auth/infrastructure/supabaseAuthGateway';
import { styles } from './authForm.styles';
import { profileStyles } from './ProfileScreen.styles';

type Field = 'rut' | 'firstName' | 'lastName';

export default function StudentProfileScreen() {
  const router = useRouter();
  const [rut, setRut] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [focused, setFocused] = useState<Field | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rutComplete = isRutComplete(rut);
  const filledCount = [rutComplete, firstName.trim() !== '', lastName.trim() !== ''].filter(Boolean).length;
  const profileReady = filledCount === 3;

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setError(null);
    if (!rutComplete) {
      setError('Ingresa tu RUT completo, con dígito verificador.');
      return;
    }

    setIsSubmitting(true);
    try {
      await completeStudentProfile({ rut, firstName, lastName }, supabaseAuthGateway);
      router.replace('/dashboard');
    } catch (submitError) {
      setError(getAuthenticationErrorMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldStyle = (field: Field) => [
    styles.inputContainer,
    focused === field && profileStyles.inputFocused,
  ];
  const fieldHandlers = (field: Field) => ({
    onFocus: () => setFocused(field),
    onBlur: () => setFocused((current) => (current === field ? null : current)),
  });

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
          <Reveal style={profileStyles.hero}>
            <View
              style={profileStyles.steps}
              accessible
              accessibilityLabel="Paso 2 de 2: completar perfil"
            >
              <View style={[profileStyles.stepBar, profileStyles.stepBarDone]} />
              <View style={[profileStyles.stepBar, profileStyles.stepBarActive]} />
              <Text style={profileStyles.stepLabel}>PASO FINAL</Text>
            </View>
            <Text style={profileStyles.title}>Tus datos de estudiante</Text>
            <Text style={profileStyles.subtitle}>
              Completa estos datos para vincular tus registros a tu cuenta.
            </Text>
          </Reveal>

          {/* ── Credencial en vivo ── */}
          <Reveal index={1} style={profileStyles.credential}>
            <StudentCredential
              firstName={firstName}
              lastName={lastName}
              rut={rut}
              ready={profileReady}
              filled={filledCount}
            />
          </Reveal>

          {/* ── Formulario ── */}
          <Reveal index={2}>
            <LiquidCard style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>RUT</Text>
                <View style={[...fieldStyle('rut'), rutComplete && profileStyles.inputDone]}>
                  <TicketIcon size={17} color="#b0a891" />
                  <TextInput
                    style={styles.input}
                    value={rut}
                    onChangeText={(text) => setRut(formatRut(text))}
                    placeholder="12.345.678-9"
                    placeholderTextColor="#b0a891"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    accessibilityLabel="RUT"
                    {...fieldHandlers('rut')}
                  />
                  {rutComplete ? (
                    <View style={profileStyles.doneBadge} accessibilityLabel="RUT completo">
                      <CheckIcon size={11} color="#ffffff" />
                    </View>
                  ) : null}
                </View>
                <Text style={profileStyles.hint}>
                  Escríbelo sin puntos ni guion; le damos el formato por ti.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre</Text>
                <View style={fieldStyle('firstName')}>
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={(text) =>
                      setFirstName(sanitizePersonName(text, FIRST_NAME_MAX_LENGTH))
                    }
                    placeholder="Tu nombre"
                    placeholderTextColor="#b0a891"
                    autoCapitalize="words"
                    maxLength={FIRST_NAME_MAX_LENGTH}
                    accessibilityLabel="Nombre"
                    {...fieldHandlers('firstName')}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Apellido</Text>
                <View style={fieldStyle('lastName')}>
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={(text) =>
                      setLastName(sanitizePersonName(text, LAST_NAME_MAX_LENGTH))
                    }
                    placeholder="Tu apellido"
                    placeholderTextColor="#b0a891"
                    autoCapitalize="words"
                    maxLength={LAST_NAME_MAX_LENGTH}
                    accessibilityLabel="Apellido"
                    {...fieldHandlers('lastName')}
                  />
                </View>
              </View>

              <AuthActionButton
                label="Guardar perfil"
                busyLabel="Guardando…"
                isBusy={isSubmitting}
                onPress={handleSubmit}
                style={styles.primaryButton}
                textStyle={styles.primaryButtonText}
                arrowStyle={styles.buttonArrow}
              />

              {error ? (
                <Text accessibilityLiveRegion="polite" style={styles.feedbackError}>
                  {error}
                </Text>
              ) : null}
            </LiquidCard>
          </Reveal>

          <Reveal index={3} style={profileStyles.note}>
            <ShieldIcon size={13} color="#b0a891" />
            <Text style={profileStyles.noteText}>
              Usamos estos datos solo para vincular tus registros a tu cuenta.
            </Text>
          </Reveal>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
