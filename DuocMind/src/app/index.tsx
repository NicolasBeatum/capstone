import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  checkBackendConnection,
  type BackendConnectionStatus,
} from '@/features/backend/application/checkBackendConnection';

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

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        DuocMind
      </Text>
      <Text style={styles.subtitle}>Estado del backend de desarrollo</Text>
      <Text accessibilityLiveRegion="polite" style={styles.status}>
        {STATUS_LABELS[status]}
      </Text>
      <Text style={styles.detail}>{STATUS_DETAILS[status]}</Text>
      {status !== 'checking' && status !== 'missing-config' && (
        <Pressable
          accessibilityRole="button"
          onPress={() => void runCheck()}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Reintentar</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f7fb',
    padding: 24,
  },
  title: {
    color: '#0b1f33',
    fontSize: 36,
    fontWeight: '700',
  },
  subtitle: {
    color: '#314b63',
    fontSize: 18,
    marginTop: 8,
  },
  status: {
    color: '#0b1f33',
    fontSize: 24,
    fontWeight: '700',
    marginTop: 32,
    textAlign: 'center',
  },
  detail: {
    color: '#314b63',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#0b4b87',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 120,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  buttonPressed: {
    backgroundColor: '#083965',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
