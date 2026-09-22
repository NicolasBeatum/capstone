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
import { styles } from './register.styles';
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
