import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from '../shared/styles/dashboard.styles';
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
    : 'rgba(255, 255, 197, 0.75)'; // luz suave #FFFFC5 en modo claro (opacidad reducida)

  const frostedCardBg = theme.isDark
    ? 'rgba(255, 255, 255, 0.06)'
    : 'rgba(255, 255, 255, 0.70)';

  const frostedCardBorder = theme.isDark
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(255, 255, 255, 0.85)';

  const testBannerBg = theme.isDark
    ? 'rgba(212, 180, 60, 0.12)'
    : 'rgba(255,255,197,0.60)'; // ajustar banner para coincidir con nuevo tono (más suave)

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
              <Text style={[styles.moodCardTitle, { color: theme.textPrimary }]}>¿Cómo te sientes hoy?</Text>
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
                                              ? 'rgba(255, 255, 197, 0.85)'
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
                      { color: isSelected ? '#1a2b44' : theme.textPrimary },
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
