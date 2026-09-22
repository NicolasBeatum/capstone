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
import { styles } from '../shared/styles/login.styles';
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
