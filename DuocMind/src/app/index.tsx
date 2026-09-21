import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function IndexRoute() {
  const router = useRouter();

  const screens = [
    {
      title: 'Iniciar Sesión',
      path: '/login',
      desc: 'Formulario con credenciales, SSO institucional y Google.',
      icon: '🔐',
    },
    {
      title: 'Crear Cuenta',
      path: '/register',
      desc: 'Registro institucional con validación de contraseña.',
      icon: '📝',
    },
    {
      title: 'Dashboard Principal',
      path: '/dashboard',
      desc: 'Resumen de carga académica, medidor de energía y ánimo.',
      icon: '📊',
    },
    {
      title: 'Check-in Emocional',
      path: '/checkin',
      desc: 'Evaluación diaria 1-10, notas e historial reciente.',
      icon: '💙',
    },
    {
      title: 'Centro de Bienestar',
      path: '/wellness',
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
        onPress={() => router.push('/login')}
        activeOpacity={0.85}
      >
        <Text style={styles.mainStartText}>Entrar al flujo (Login)</Text>
        <Text style={styles.mainStartArrow}>→</Text>
      </TouchableOpacity>

      <Text style={styles.sectionHeader}>EXPLORAR PANTALLAS INDIVIDUALES</Text>

      <View style={styles.screenList}>
        {screens.map((screen) => (
          <TouchableOpacity
            key={screen.path}
            style={styles.screenCard}
            onPress={() => router.push(screen.path as any)}
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

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 40,
    backgroundColor: '#f9f9f7',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#f3e7a0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoEmoji: {
    fontSize: 30,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a2b44',
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  pillTag: {
    backgroundColor: '#fbf6dc',
    borderWidth: 1,
    borderColor: '#f3e7a0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 10,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a2b44',
  },
  mainStartButton: {
    backgroundColor: '#1a2b44',
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#1a2b44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  mainStartText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginRight: 8,
  },
  mainStartArrow: {
    color: '#f3e7a0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 12,
  },
  screenList: {
    gap: 10,
  },
  screenCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  screenIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  screenIcon: {
    fontSize: 18,
  },
  screenInfo: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a2b44',
  },
  screenDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 15,
  },
  screenArrow: {
    fontSize: 20,
    color: '#cbd5e1',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
