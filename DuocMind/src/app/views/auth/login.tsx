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
import { styles } from '../../../shared/styles/login.styles';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('c.mora@universidad.edu');
  const [password, setPassword] = useState('EstudioSereno2025');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Campos requeridos', 'Por favor ingresa tu correo y contrase├▒a.');
      return;
    }
    router.push('/dashboard');
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Recuperaci├│n de contrase├▒a',
      'Se ha enviado un enlace de recuperaci├│n a tu correo institucional.'
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
            <Text style={styles.iconText}>­ƒî┐</Text>
          </View>
          <Text style={styles.bannerTitle}>Bienvenido de nuevo</Text>
          <Text style={styles.bannerSubtitle}>
            Tu espacio para cultivar serenidad y rendimiento acad├®mico.
          </Text>
          <View style={styles.badgePill}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Pausa consciente ÔÇó Enfoque sereno</Text>
          </View>
        </View>

        {/* Tarjeta de Formulario */}
        <View style={styles.formCard}>
          {/* Campo Correo */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo institucional</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLeadingIcon}>Ô£ë</Text>
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

          {/* Campo Contrase├▒a */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Contrase├▒a</Text>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>┬┐Olvidaste tu contrase├▒a?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLeadingIcon}>­ƒöÆ</Text>
              <TextInput
                style={styles.input}
                placeholder="ÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇóÔÇó"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '­ƒæü' : '­ƒÖê'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bot├│n de Inicio */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Iniciar Sesi├│n</Text>
            <Text style={styles.buttonArrow}>ÔåÆ</Text>
          </TouchableOpacity>

          {/* Separador */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O CONTIN├ÜA CON</Text>
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
            <Text style={styles.ssoIcon}>­ƒÅø</Text>
            <Text style={styles.ssoButtonText}>Portal Universitario (SSO)</Text>
          </TouchableOpacity>
        </View>

        {/* Enlace a Registro */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            ┬┐No tienes cuenta?{' '}
            <Text
              style={styles.registerLink}
              onPress={() => router.push('/register')}
            >
              Reg├¡strate aqu├¡
            </Text>
          </Text>
          <View style={styles.securityBadge}>
            <Text style={styles.shieldIcon}>­ƒøí</Text>
            <Text style={styles.securityText}>
              Entorno protegido y libre de distracciones
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
