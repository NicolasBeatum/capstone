import React, { useState } from 'react';
import {
  Alert,
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
import {
  completeStudentProfile,
  getAuthenticationErrorMessage,
} from '@/features/auth/application/authentication';
import { supabaseAuthGateway } from '@/features/auth/infrastructure/supabaseAuthGateway';
import { styles } from './authForm.styles';

export default function StudentProfileScreen() {
  const router = useRouter();
  const [rut, setRut] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setIsSubmitting(true);
    try {
      await completeStudentProfile({ rut, firstName, lastName }, supabaseAuthGateway);
      router.replace('/dashboard');
    } catch (error) {
      Alert.alert('No se pudo completar el perfil', getAuthenticationErrorMessage(error));
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
          <View style={styles.intro}>
            <Text style={styles.introEyebrow}>COMPLETAR PERFIL</Text>
            <Text style={styles.introTitle}>Tus datos de estudiante</Text>
            <Text style={styles.introSubtitle}>
              Completa estos datos para vincular tus registros a tu cuenta.
            </Text>
          </View>

          <LiquidCard style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>RUT</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={rut}
                  onChangeText={setRut}
                  placeholder="12.345.678-9"
                  placeholderTextColor="#b0a891"
                  autoCapitalize="characters"
                  accessibilityLabel="RUT"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Nombre"
                  placeholderTextColor="#b0a891"
                  autoCapitalize="words"
                  accessibilityLabel="Nombre"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Apellido</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Apellido"
                  placeholderTextColor="#b0a891"
                  autoCapitalize="words"
                  accessibilityLabel="Apellido"
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
          </LiquidCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
