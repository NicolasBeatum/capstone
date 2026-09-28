import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  completeStudentProfile,
  getAuthenticationErrorMessage,
} from '@/features/auth/application/authentication';
import { supabaseAuthGateway } from '@/features/auth/infrastructure/supabaseAuthGateway';
import { styles } from '@/shared/styles/register.styles';

export default function StudentProfileScreen() {
  const router = useRouter();
  const [rut, setRut] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await completeStudentProfile({ rut, firstName, lastName }, supabaseAuthGateway);
      router.replace('/views/dashboard');
    } catch (error) {
      Alert.alert('No se pudo completar el perfil', getAuthenticationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
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
        <View style={styles.topBar}>
          <View style={styles.topBarSpacer} />
          <Text style={styles.topBarTitle}>COMPLETAR PERFIL</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Tus datos de estudiante</Text>
          <Text style={styles.welcomeSubtitle}>
            Completa estos datos para vincular tus registros a tu cuenta.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>RUT</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={rut}
                onChangeText={setRut}
                placeholder="12.345.678-9"
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
                autoCapitalize="words"
                accessibilityLabel="Apellido"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? 'Guardando…' : 'Guardar perfil'}
            </Text>
            {!isSubmitting && <Text style={styles.buttonArrow}>→</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}