import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);

  const handleRegister = () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    if (!acceptTerms) {
      Alert.alert('Términos', 'Debes aceptar los términos y condiciones para continuar.');
      return;
    }
    router.push('/dashboard');
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
            onPress={() => router.push('/login')}
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
                  {password.length > 8 && hasNumber && hasUppercase ? 'Buena' : 'En progreso'}
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
          >
            <View style={[styles.checkbox, acceptTerms && styles.checkboxActive]}>
              {acceptTerms && <Text style={styles.checkboxCheck}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              Acepto los términos de servicio y las políticas de privacidad de Equilibrio Académico.
            </Text>
          </TouchableOpacity>

          {/* Botón Crear Cuenta */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRegister}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Crear Cuenta</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            ¿Ya tienes una cuenta?{' '}
            <Text
              style={styles.loginLink}
              onPress={() => router.push('/login')}
            >
              Inicia sesión
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f7',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 16,
    color: '#334155',
    fontWeight: 'bold',
  },
  topBarTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a2b44',
    letterSpacing: 1,
  },
  topBarSpacer: {
    width: 36,
  },
  welcomeCard: {
    backgroundColor: '#fbf6dc',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f3e7a0',
    marginBottom: 14,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e7a0',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1a2b44',
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a2b44',
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  communityBanner: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16,
  },
  communityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  communityIcon: {
    fontSize: 20,
  },
  communityTextContainer: {
    flex: 1,
  },
  communityTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a2b44',
  },
  communitySubtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
    lineHeight: 14,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a2b44',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
  },
  inputLeadingIcon: {
    fontSize: 14,
    color: '#94a3b8',
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 12,
    color: '#1e293b',
  },
  eyeButton: {
    padding: 6,
  },
  eyeIcon: {
    fontSize: 14,
  },
  strengthBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  strengthLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  strengthStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },
  strengthBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  strengthBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  reqGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 4,
  },
  reqIcon: {
    fontSize: 11,
    color: '#94a3b8',
    marginRight: 4,
  },
  reqPassed: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  reqText: {
    fontSize: 9,
    color: '#64748b',
  },
  reqPassedText: {
    color: '#10b981',
    fontWeight: '600',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: '#1a2b44',
    borderColor: '#1a2b44',
  },
  checkboxCheck: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: 10,
    color: '#64748b',
    lineHeight: 14,
  },
  primaryButton: {
    backgroundColor: '#1a2b44',
    borderRadius: 14,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginRight: 6,
  },
  buttonArrow: {
    color: '#ffffff',
    fontSize: 14,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
  },
  loginLink: {
    color: '#1a2b44',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

