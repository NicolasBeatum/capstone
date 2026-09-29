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
import { GlassCard, LiquidBackground } from '@/shared/components/glass';
import {
  EyeIcon,
  EyeOffIcon,
  GradCapIcon,
  LeafIcon,
  LockIcon,
  MailIcon,
  ShieldIcon,
  SparkleIcon,
} from '@/shared/components/icons';
import { styles } from '@/shared/styles/login.styles';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }
    router.push('/views/dashboard');
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Recuperación de contraseña',
      'Se ha enviado un enlace de recuperación a tu correo institucional.'
    );
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
          {/* ── Bienvenida ── */}
          <View style={styles.hero}>
            <View style={styles.heroIconCircle}>
              <LeafIcon size={28} color="#9aa55c" />
            </View>
            <Text style={styles.heroTitle}>Bienvenido de nuevo</Text>
            <Text style={styles.heroSubtitle}>
              Tu espacio para cultivar serenidad y rendimiento académico.
            </Text>
            <View style={styles.badgePill}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>Pausa consciente • Enfoque sereno</Text>
              <SparkleIcon size={9} color="#d4b43c" />
            </View>
          </View>

          {/* ── Formulario ── */}
          <GlassCard style={styles.formCard}>
            {/* Campo Correo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo institucional</Text>
              <View style={styles.inputContainer}>
                <MailIcon size={17} color="#b0a891" />
                <TextInput
                  style={styles.input}
                  placeholder="ejemplo@universidad.edu"
                  placeholderTextColor="#b0a891"
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
                <LockIcon size={17} color="#b0a891" />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
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
              onPress={() => router.push('/views/dashboard')}
              activeOpacity={0.8}
            >
              <Text style={styles.socialIcon}>G</Text>
              <Text style={styles.secondaryButtonText}>Cuenta de Google</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ssoButton}
              onPress={() => router.push('/views/dashboard')}
              activeOpacity={0.8}
            >
              <GradCapIcon size={18} color="#1a2b44" />
              <Text style={styles.ssoButtonText}>Portal Universitario (SSO)</Text>
            </TouchableOpacity>
          </GlassCard>

          {/* ── Enlace a Registro ── */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              ¿No tienes cuenta?{' '}
              <Text
                style={styles.registerLink}
                onPress={() => router.push('/views/auth/register')}
              >
                Regístrate aquí
              </Text>
            </Text>
            <View style={styles.securityBadge}>
              <ShieldIcon size={13} color="#b0a891" />
              <Text style={styles.securityText}>
                Entorno protegido y libre de distracciones
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
