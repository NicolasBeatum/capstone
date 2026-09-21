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

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('c.mora@universidad.edu');
  const [password, setPassword] = useState('EstudioSereno2025');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }
    router.push('/dashboard');
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Recuperación de contraseña',
      'Se ha enviado un enlace de recuperación a tu correo institucional.'
    );
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
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
            <Text style={styles.buttonArrow}>→</Text>
          </TouchableOpacity>

          {/* Separador */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O CONTINÚA CON</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Botones de inicio alternativo */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/dashboard')}
            activeOpacity={0.8}
          >
            <Text style={styles.socialIcon}>G</Text>
            <Text style={styles.secondaryButtonText}>Cuenta de Google</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ssoButton}
            onPress={() => router.push('/dashboard')}
            activeOpacity={0.8}
          >
            <Text style={styles.ssoIcon}>🏛</Text>
            <Text style={styles.ssoButtonText}>Portal Universitario (SSO)</Text>
          </TouchableOpacity>
        </View>

        {/* Enlace a Registro */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            ¿No tienes cuenta?{' '}
            <Text
              style={styles.registerLink}
              onPress={() => router.push('/register')}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f7',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 36,
    paddingBottom: 40,
  },
  bannerCard: {
    backgroundColor: '#fbf6dc',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3e7a0',
    marginBottom: 20,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#f3e7a0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 26,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a2b44',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 12,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d4b43c',
    marginRight: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a2b44',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a2b44',
    marginBottom: 6,
  },
  forgotPasswordText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d4b43c',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
  },
  inputLeadingIcon: {
    fontSize: 15,
    color: '#94a3b8',
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 13,
    color: '#1e293b',
  },
  eyeButton: {
    padding: 6,
  },
  eyeIcon: {
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#1a2b44',
    borderRadius: 16,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#1a2b44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
  },
  buttonArrow: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    marginHorizontal: 10,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    height: 44,
    marginBottom: 10,
  },
  socialIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4285F4',
    marginRight: 8,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  ssoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbf6dc',
    borderWidth: 1,
    borderColor: '#f3e7a0',
    borderRadius: 16,
    height: 44,
  },
  ssoIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  ssoButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a2b44',
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
  },
  registerLink: {
    color: '#1a2b44',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  shieldIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  securityText: {
    fontSize: 10,
    color: '#94a3b8',
  },
});

