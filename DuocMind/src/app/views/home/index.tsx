import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';

import {
  checkBackendConnection,
  type BackendConnectionStatus,
} from '@/features/backend/application/checkBackendConnection';
import { styles } from '@/shared/styles/index.styles';

type ScreenStatus = BackendConnectionStatus | 'checking';

const STATUS_LABELS: Record<ScreenStatus, string> = {
  checking: 'Comprobando…',
  connected: 'Backend conectado',
  'missing-config': 'Falta configuración',
  offline: 'Sin red',
  unavailable: 'Backend no disponible',
};

const STATUS_DETAILS: Record<ScreenStatus, string> = {
  checking: 'Estamos comprobando el backend de desarrollo.',
  connected: 'El servicio de autenticación del proyecto respondió.',
  'missing-config': 'Configura el entorno local y recarga la aplicación.',
  offline: 'Comprueba tu conexión y vuelve a intentarlo.',
  unavailable: 'El servicio no respondió. Puedes volver a intentarlo.',
};

export default function IndexRoute() {
  const router = useRouter();
  const [status, setStatus] = useState<ScreenStatus>('checking');
  const requestNumber = useRef(0);

  const runCheck = useCallback(async () => {
    const currentRequest = ++requestNumber.current;
    setStatus('checking');

    const result = await checkBackendConnection();
    if (currentRequest === requestNumber.current) {
      setStatus(result);
    }
  }, []);

  useEffect(() => {
    void runCheck();
    return () => {
      requestNumber.current += 1;
    };
  }, [runCheck]);

  const screens: Array<{
    title: string;
    path: Href;
    desc: string;
    icon: string;
  }> = [
    {
      title: 'Iniciar Sesión',
      path: '/views/auth/login',
      desc: 'Formulario con credenciales, SSO institucional y Google.',
      icon: '🔐',
    },
    {
      title: 'Crear Cuenta',
      path: '/views/auth/register',
      desc: 'Registro institucional con validación de contraseña.',
      icon: '📝',
    },
    {
      title: 'Dashboard Principal',
      path: '/views/dashboard',
      desc: 'Resumen de carga académica, medidor de energía y ánimo.',
      icon: '📊',
    },
    {
      title: 'Check-in Emocional',
      path: '/views/checkin',
      desc: 'Evaluación diaria 1-10, notas e historial reciente.',
      icon: '💙',
    },
    {
      title: 'Centro de Bienestar',
      path: '/views/wellness',
      desc: 'Recursos, autoevaluación guiada y tips de salud mental.',
      icon: '🌿',
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerBox}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoEmoji}>🌿</Text>
        </View>
        <Text style={styles.brandTitle}>DuocMind</Text>
        <Text style={styles.brandSubtitle}>Equilibrio Académico y Mental</Text>
        <View style={styles.pillTag}>
          <Text style={styles.pillText}>Prototipo Interactivo • Stitch UI</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.mainStartButton}
        onPress={() => router.push('/views/auth/login')}
        activeOpacity={0.85}
      >
        <Text style={styles.mainStartText}>Entrar al flujo (Login)</Text>
        <Text style={styles.mainStartArrow}>→</Text>
      </TouchableOpacity>

      <View style={styles.backendCard}>
        <View style={styles.backendTextGroup}>
          <Text style={styles.backendEyebrow}>ESTADO DEL BACKEND</Text>
          <Text accessibilityLiveRegion="polite" style={styles.backendStatus}>
            {STATUS_LABELS[status]}
          </Text>
          <Text style={styles.backendDetail}>{STATUS_DETAILS[status]}</Text>
        </View>
        {status !== 'checking' && status !== 'missing-config' && (
          <Pressable
            accessibilityRole="button"
            onPress={() => void runCheck()}
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed,
            ]}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.sectionHeader}>EXPLORAR PANTALLAS INDIVIDUALES</Text>

      <View style={styles.screenList}>
        {screens.map((screen) => (
          <TouchableOpacity
            key={screen.title}
            style={styles.screenCard}
            onPress={() => router.push(screen.path)}
            activeOpacity={0.8}
          >
            <View style={styles.screenIconBox}>
              <Text style={styles.screenIcon}>{screen.icon}</Text>
            </View>
            <View style={styles.screenInfo}>
              <Text style={styles.screenTitle}>{screen.title}</Text>
              <Text style={styles.screenDesc}>{screen.desc}</Text>
            </View>
            <Text style={styles.screenArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
