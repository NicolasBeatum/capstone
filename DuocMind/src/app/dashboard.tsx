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
import { useTheme } from '../shared/theme';
import { AppHeader } from '../shared/components/AppHeader';
import { BottomNav } from '../shared/components/BottomNav';

type MoodType = 'Calmo' | 'Estresado' | 'Alegre' | 'Cansado';

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [selectedMood, setSelectedMood] = useState<MoodType>('Calmo');

  const moods: { name: MoodType; icon: string }[] = [
    { name: 'Calmo', icon: '🧘' },
    { name: 'Estresado', icon: '⚡' },
    { name: 'Alegre', icon: '😊' },
    { name: 'Cansado', icon: '🔋' },
  ];

  const handleTestPress = () => {
    Alert.alert(
      'Test de Estrés Académico',
      'El módulo de evaluación periódica está programado para una próxima fase de implementación.'
    );
  };

  /* ── Tokens dinámicos de glassmorphism según tema ── */
  const moodCardBg = theme.isDark
    ? 'rgba(26, 43, 68, 0.75)'
    : 'rgba(26, 43, 68, 0.90)';

  const frostedCardBg = theme.isDark
    ? 'rgba(255, 255, 255, 0.06)'
    : 'rgba(255, 255, 255, 0.70)';

  const frostedCardBorder = theme.isDark
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(255, 255, 255, 0.85)';

  const testBannerBg = theme.isDark
    ? 'rgba(212, 180, 60, 0.12)'
    : 'rgba(251, 246, 220, 0.75)';

  const testBannerBorder = theme.isDark
    ? 'rgba(243, 231, 160, 0.25)'
    : 'rgba(243, 231, 160, 0.90)';

  const moodPillBg = theme.isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(255, 255, 255, 0.18)';

  const moodPillBorder = theme.isDark
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(255, 255, 255, 0.30)';

  return (
    <View style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* ── Orbes líquidos de fondo (Liquid Orbs) ── */}
      <View
        style={[styles.liquidOrbTopRight, { backgroundColor: theme.orbPrimary }]}
        pointerEvents="none"
      />
      <View
        style={[styles.liquidOrbMidLeft, { backgroundColor: theme.orbSecondary }]}
        pointerEvents="none"
      />
      <View
        style={[styles.liquidOrbBottomRight, { backgroundColor: theme.orbTertiary }]}
        pointerEvents="none"
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <AppHeader title="Equilibrio Académico" subtitle='"Un paso a la vez"' />

        {/* ── Card: Estado de Ánimo — Deep Glass ── */}
        <View
          style={[
            styles.glassMoodCard,
            {
              backgroundColor: moodCardBg,
              borderColor: theme.glassDarkBorder,
            },
          ]}
        >
          {/* Reflejo especular superior */}
          <View style={styles.glassSpecularTop} />
          {/* Reflejo especular lateral izquierdo */}
          <View style={styles.glassSpecularLeft} />

          <View style={styles.moodCardHeader}>
            <View>
              <Text style={styles.moodCardEyebrow}>ESTADO ACTUAL</Text>
              <Text style={styles.moodCardTitle}>¿Cómo te sientes hoy?</Text>
            </View>
            <View
              style={[
                styles.todayPill,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(243, 231, 160, 0.15)'
                    : 'rgba(255, 255, 255, 0.12)',
                  borderColor: theme.isDark
                    ? 'rgba(243, 231, 160, 0.35)'
                    : 'rgba(243, 231, 160, 0.60)',
                },
              ]}
            >
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
                    {
                      backgroundColor: isSelected
                        ? 'rgba(251, 246, 220, 0.96)'
                        : moodPillBg,
                      borderColor: isSelected ? '#d4b43c' : moodPillBorder,
                      borderTopColor: isSelected
                        ? '#f3e7a0'
                        : theme.glassSpecular,
                      shadowColor: isSelected ? '#d4b43c' : 'transparent',
                      shadowOpacity: isSelected ? 0.4 : 0,
                      shadowRadius: isSelected ? 12 : 0,
                      elevation: isSelected ? 4 : 0,
                    },
                  ]}
                  onPress={() => setSelectedMood(item.name)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.moodEmoji}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.moodPillLabel,
                      { color: isSelected ? '#1a2b44' : theme.textOnDarkMuted },
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Botón Check-in Detallado */}
          <TouchableOpacity
            style={styles.detailedButton}
            onPress={() => router.push('/checkin')}
            activeOpacity={0.85}
          >
            <Text style={styles.detailedButtonText}>Registrar Check-in Detallado</Text>
            <Text style={styles.detailedButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* ── Medidores — Frosted Glass ── */}
        <View style={styles.gaugesSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Resumen de Carga & Energía
            </Text>
            <View
              style={[
                styles.weekBadge,
                { backgroundColor: frostedCardBg, borderColor: frostedCardBorder },
              ]}
            >
              <Text style={[styles.weekBadgeText, { color: theme.textSecondary }]}>
                Semana 8
              </Text>
            </View>
          </View>

          <View style={styles.gaugesRow}>
            {/* Medidor Carga */}
            <View
              style={[
                styles.frostedCard,
                {
                  backgroundColor: frostedCardBg,
                  borderColor: frostedCardBorder,
                  borderTopColor: theme.isDark
                    ? 'rgba(255,255,255,0.18)'
                    : '#ffffff',
                },
              ]}
            >
              <View style={[styles.glowDot, { backgroundColor: theme.isDark ? 'rgba(26,43,68,0.20)' : 'rgba(26,43,68,0.07)' }]} />
              <View style={[styles.gaugeCircle, styles.gaugeNavy]}>
                <Text style={styles.gaugeValueNavy}>70%</Text>
              </View>
              <Text style={[styles.gaugeTitle, { color: theme.textPrimary }]}>
                Carga Académica
              </Text>
              <Text style={[styles.gaugeStatus, { color: theme.textMuted }]}>
                3 entregas cerca
              </Text>
            </View>

            {/* Medidor Energía */}
            <View
              style={[
                styles.frostedCard,
                {
                  backgroundColor: frostedCardBg,
                  borderColor: frostedCardBorder,
                  borderTopColor: theme.isDark
                    ? 'rgba(255,255,255,0.18)'
                    : '#ffffff',
                },
              ]}
            >
              <View style={[styles.glowDot, { backgroundColor: theme.isDark ? 'rgba(212,180,60,0.18)' : 'rgba(212,180,60,0.12)' }]} />
              <View style={[styles.gaugeCircle, styles.gaugeYellow]}>
                <Text style={styles.gaugeValueYellow}>45%</Text>
              </View>
              <Text style={[styles.gaugeTitle, { color: theme.textPrimary }]}>
                Nivel de Energía
              </Text>
              <Text style={[styles.gaugeStatus, { color: theme.textMuted }]}>
                Requiere pausa
              </Text>
            </View>
          </View>
        </View>

        {/* ── Banner Test — Amber Glass ── */}
        <View
          style={[
            styles.testBanner,
            {
              backgroundColor: testBannerBg,
              borderColor: testBannerBorder,
              borderTopColor: theme.isDark
                ? 'rgba(255,255,255,0.10)'
                : 'rgba(255,255,255,0.70)',
            },
          ]}
        >
          <View style={styles.testBannerContent}>
            <View
              style={[
                styles.testBadge,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(243,231,160,0.20)'
                    : 'rgba(243,231,160,0.95)',
                  borderColor: theme.isDark
                    ? 'rgba(243,231,160,0.30)'
                    : 'rgba(255,255,255,0.60)',
                },
              ]}
            >
              <Text
                style={[
                  styles.testBadgeText,
                  { color: theme.isDark ? '#f3e7a0' : '#1a2b44' },
                ]}
              >
                EVALUACIÓN PERIÓDICA
              </Text>
            </View>
            <Text style={[styles.testBannerTitle, { color: theme.textPrimary }]}>
              Test de Estrés Académico
            </Text>
            <Text style={[styles.testBannerDesc, { color: theme.textSecondary }]}>
              Mide tu sobrecarga cognitiva en 3 minutos.
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.testBannerButton,
              {
                backgroundColor: theme.isDark ? 'rgba(26,43,68,0.90)' : '#1a2b44',
                borderColor: theme.isDark
                  ? 'rgba(255,255,255,0.18)'
                  : 'rgba(255,255,255,0.22)',
              },
            ]}
            onPress={handleTestPress}
            activeOpacity={0.85}
          >
            <Text style={styles.testBannerButtonText}>Hacer</Text>
            <Text style={styles.testBannerButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNav currentTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  /* ── Liquid Orbs ── */
  liquidOrbTopRight: {
    position: 'absolute',
    top: -80,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  liquidOrbMidLeft: {
    position: 'absolute',
    top: 280,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  liquidOrbBottomRight: {
    position: 'absolute',
    bottom: 80,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 28,
  },
  /* ── Tarjeta Principal (Deep Liquid Glass) ── */
  glassMoodCard: {
    borderRadius: 28,
    padding: 20,
    marginBottom: 22,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.28)',
    shadowColor: '#0a1220',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  glassSpecularTop: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  glassSpecularLeft: {
    position: 'absolute',
    top: 8,
    left: 0,
    bottom: 8,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  moodCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  moodCardEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f3e7a0',
    letterSpacing: 1.5,
  },
  moodCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 3,
  },
  todayPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  todayText: {
    color: '#f3e7a0',
    fontSize: 11,
    fontWeight: '700',
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  moodPill: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    width: '23%',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
  },
  moodEmoji: {
    fontSize: 22,
    marginBottom: 5,
  },
  moodPillLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  detailedButton: {
    backgroundColor: '#f3e7a0',
    borderRadius: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    borderTopColor: '#ffffff',
    shadowColor: '#d4b43c',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 3,
  },
  detailedButtonText: {
    color: '#1a2b44',
    fontSize: 12,
    fontWeight: '800',
    marginRight: 6,
  },
  detailedButtonArrow: {
    color: '#1a2b44',
    fontSize: 16,
    fontWeight: 'bold',
  },
  /* ── Medidores ── */
  gaugesSection: {
    marginBottom: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  weekBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  weekBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  gaugesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  /* Frosted Glass Card */
  frostedCard: {
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    width: '48%',
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  glowDot: {
    position: 'absolute',
    top: -16,
    right: -16,
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  gaugeCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    marginBottom: 10,
  },
  gaugeNavy: {
    borderColor: '#1a2b44',
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
  },
  gaugeYellow: {
    borderColor: '#d4b43c',
    backgroundColor: 'rgba(251, 246, 220, 0.85)',
  },
  gaugeValueNavy: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a2b44',
  },
  gaugeValueYellow: {
    fontSize: 17,
    fontWeight: '800',
    color: '#d4b43c',
  },
  gaugeTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  gaugeStatus: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  /* ── Banner Test ── */
  testBanner: {
    borderWidth: 1.5,
    borderRadius: 26,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#d4b43c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 3,
  },
  testBannerContent: {
    flex: 1,
    marginRight: 10,
  },
  testBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    marginBottom: 5,
    borderWidth: 1,
  },
  testBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  testBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  testBannerDesc: {
    fontSize: 10,
    marginTop: 2,
    lineHeight: 14,
  },
  testBannerButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#1a2b44',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.20,
    shadowRadius: 10,
    elevation: 2,
  },
  testBannerButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  testBannerButtonArrow: {
    color: '#f3e7a0',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
