import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '../shared/components/AppHeader';
import { BottomNav } from '../shared/components/BottomNav';

type MoodType = 'Calmo' | 'Estresado' | 'Alegre' | 'Cansado';

export default function DashboardScreen() {
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<MoodType>('Calmo');

  const moods: { name: MoodType; icon: string; color: string }[] = [
    { name: 'Calmo', icon: '🧘', color: '#d97706' },
    { name: 'Estresado', icon: '⚡', color: '#f43f5e' },
    { name: 'Alegre', icon: '😊', color: '#f59e0b' },
    { name: 'Cansado', icon: '🔋', color: '#64748b' },
  ];

  const handleTestPress = () => {
    Alert.alert(
      'Test de Estrés Académico',
      'El módulo de evaluación periódica está programado para una próxima fase de implementación.'
    );
  };

  return (
    <View style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header persistente con Avatar y Menú de Perfil */}
        <AppHeader title="Equilibrio Académico" subtitle='"Un paso a la vez"' />

        {/* Card: Check-in Rápido de Ánimo */}
        <View style={styles.moodCard}>
          <View style={styles.moodCardHeader}>
            <View>
              <Text style={styles.moodCardEyebrow}>ESTADO ACTUAL</Text>
              <Text style={styles.moodCardTitle}>¿Cómo te sientes hoy?</Text>
            </View>
            <View style={styles.todayPill}>
              <Text style={styles.todayText}>Hoy</Text>
            </View>
          </View>

          {/* Selector de Ánimo */}
          <View style={styles.moodGrid}>
            {moods.map((item) => {
              const isSelected = selectedMood === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[
                    styles.moodPill,
                    isSelected && styles.moodPillActive,
                  ]}
                  onPress={() => setSelectedMood(item.name)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.moodEmoji}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.moodPillLabel,
                      isSelected && styles.moodPillLabelActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Botón hacia Check-in Detallado */}
          <TouchableOpacity
            style={styles.detailedCheckinButton}
            onPress={() => router.push('/checkin')}
            activeOpacity={0.85}
          >
            <Text style={styles.detailedButtonText}>Registrar Check-in Detallado</Text>
            <Text style={styles.detailedButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Resumen de Carga & Energía */}
        <View style={styles.gaugesSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Resumen de Carga & Energía</Text>
            <Text style={styles.sectionSubtitle}>Semana 8</Text>
          </View>

          <View style={styles.gaugesRow}>
            {/* Medidor: Carga Académica */}
            <View style={styles.gaugeCard}>
              <View style={[styles.gaugeCircle, styles.gaugeBorderNavy]}>
                <Text style={styles.gaugeValueNavy}>70%</Text>
              </View>
              <Text style={styles.gaugeTitle}>Carga Académica</Text>
              <Text style={styles.gaugeStatus}>3 entregas cerca</Text>
            </View>

            {/* Medidor: Nivel de Energía */}
            <View style={styles.gaugeCard}>
              <View style={[styles.gaugeCircle, styles.gaugeBorderYellow]}>
                <Text style={styles.gaugeValueYellow}>45%</Text>
              </View>
              <Text style={styles.gaugeTitle}>Nivel de Energía</Text>
              <Text style={styles.gaugeStatus}>Requiere pausa</Text>
            </View>
          </View>
        </View>

        {/* Banner de Test de Estrés */}
        <View style={styles.testBanner}>
          <View style={styles.testBannerContent}>
            <View style={styles.testBadge}>
              <Text style={styles.testBadgeText}>EVALUACIÓN PERIÓDICA</Text>
            </View>
            <Text style={styles.testBannerTitle}>Test de Estrés Académico</Text>
            <Text style={styles.testBannerDesc}>
              Mide tu sobrecarga cognitiva en 3 minutos.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.testBannerButton}
            onPress={handleTestPress}
            activeOpacity={0.85}
          >
            <Text style={styles.testBannerButtonText}>Hacer</Text>
            <Text style={styles.testBannerButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Navegación Inferior Persistente */}
      <BottomNav currentTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f7',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a2b44',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f3e7a0',
  },
  avatarInitial: {
    color: '#f3e7a0',
    fontSize: 14,
    fontWeight: '700',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  appTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a2b44',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  quoteIcon: {
    fontSize: 28,
    color: '#cbd5e1',
    fontWeight: 'bold',
  },
  moodCard: {
    backgroundColor: '#1a2b44',
    borderRadius: 26,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#1a2b44',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  moodCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  moodCardEyebrow: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f3e7a0',
    letterSpacing: 1,
  },
  moodCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  todayPill: {
    backgroundColor: '#243a5e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayText: {
    color: '#f3e7a0',
    fontSize: 11,
    fontWeight: '700',
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  moodPill: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    width: '23%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  moodPillActive: {
    backgroundColor: '#fbf6dc',
    borderColor: '#d4b43c',
  },
  moodEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  moodPillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1a2b44',
  },
  moodPillLabelActive: {
    color: '#1a2b44',
  },
  detailedCheckinButton: {
    backgroundColor: '#f3e7a0',
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailedButtonText: {
    color: '#1a2b44',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 6,
  },
  detailedButtonArrow: {
    color: '#1a2b44',
    fontSize: 14,
    fontWeight: 'bold',
  },
  gaugesSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a2b44',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
  },
  gaugesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gaugeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  gaugeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    marginBottom: 10,
  },
  gaugeBorderNavy: {
    borderColor: '#1a2b44',
    backgroundColor: '#f8fafc',
  },
  gaugeBorderYellow: {
    borderColor: '#d4b43c',
    backgroundColor: '#fbf6dc',
  },
  gaugeValueNavy: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a2b44',
  },
  gaugeValueYellow: {
    fontSize: 16,
    fontWeight: '800',
    color: '#d4b43c',
  },
  gaugeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a2b44',
  },
  gaugeStatus: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  testBanner: {
    backgroundColor: '#fbf6dc',
    borderWidth: 1,
    borderColor: '#f3e7a0',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testBannerContent: {
    flex: 1,
    marginRight: 10,
  },
  testBadge: {
    backgroundColor: '#f3e7a0',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  testBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#1a2b44',
    letterSpacing: 0.5,
  },
  testBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a2b44',
  },
  testBannerDesc: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  testBannerButton: {
    backgroundColor: '#1a2b44',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  testBannerButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 4,
  },
  testBannerButtonArrow: {
    color: '#ffffff',
    fontSize: 12,
  },
});

