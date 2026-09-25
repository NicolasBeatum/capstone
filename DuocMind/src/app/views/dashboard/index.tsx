import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { BottomNav } from '@/shared/components/BottomNav';
import { LiquidBackground, LiquidCard, LiquidPanel } from '@/shared/components/glass';
import { WeekChart, type WeekDayData } from '@/shared/components/WeekChart';
import {
  BellIcon,
  ClipboardIcon,
  HandsHeartIcon,
  HeartIcon,
  LeafIcon,
  SparkleIcon,
  WindIcon,
} from '@/shared/components/icons';
import { styles } from '@/shared/styles/dashboard.styles';

/* Datos de muestra hasta que el histórico real esté disponible */
const SAMPLE_WEEK: WeekDayData[] = [
  { day: 'L', mood: 'Bien', value: 62 },
  { day: 'M', mood: 'Muy bien', value: 78 },
  { day: 'X', mood: 'Neutro', value: 48 },
  { day: 'J', mood: 'Mal', value: 30 },
  { day: 'V', mood: 'Bien', value: 66 },
  { day: 'S', mood: 'Muy bien', value: 85 },
  { day: 'D', mood: 'Bien', value: 58 },
];

export default function DashboardScreen() {
  const router = useRouter();

  const quickActions: Array<{ title: string; icon: React.ReactNode; path: Href }> = [
    { title: 'Check-in emocional', icon: <HeartIcon size={24} />, path: '/views/checkin' },
    { title: 'Centro de bienestar', icon: <LeafIcon size={24} />, path: '/views/wellness' },
    { title: 'Test diario', icon: <ClipboardIcon size={24} />, path: '/views/tests/daily-test' },
    {
      title: 'Recursos de apoyo',
      icon: <HandsHeartIcon size={24} />,
      path: '/views/tests/crisis-resources',
    },
  ];

  return (
    <View style={styles.safeArea}>
      <LiquidBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Header: saludo personalizado ── */}
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.greetingTitle}>¡Hola, Camila!</Text>
            <Text style={styles.greetingSubtitle}>Un paso a la vez</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>CM</Text>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Notificaciones"
          >
            <BellIcon size={20} />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        {/* ── Tu semana de un vistazo ── */}
        <LiquidCard style={styles.weekCard}>
          <View style={styles.weekCardHeader}>
            <Text style={styles.weekCardTitle}>Tu semana de un vistazo</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.weekCardLink}>Ver más →</Text>
            </TouchableOpacity>
          </View>
          <WeekChart data={SAMPLE_WEEK} todayIndex={6} />
        </LiquidCard>

        {/* ── Test semanal de bienestar ── */}
        <LiquidPanel from="#fbeec0" to="#eec25e" radius={24} style={styles.testBanner}>
          <View style={styles.testBannerContent}>
            <View style={styles.testBadge}>
              <Text style={styles.testBadgeText}>TEST SEMANAL</Text>
            </View>
            <Text style={styles.testBannerTitle}>¡Realiza tu test semanal de bienestar!</Text>
            <Text style={styles.testBannerDesc}>
              Mide tu bienestar general y revisa cómo va tu semana.
            </Text>
            <TouchableOpacity
              style={styles.testBannerButton}
              onPress={() => router.push('/views/tests/daily-test')}
              activeOpacity={0.85}
            >
              <Text style={styles.testBannerButtonText}>Realizar test</Text>
              <Text style={styles.testBannerButtonArrow}>→</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.testBannerIllustration}>
            <SparkleIcon size={12} />
            <ClipboardIcon size={52} />
            <SparkleIcon size={9} color="#e8a93c" />
          </View>
        </LiquidPanel>

        {/* ── Accesos rápidos ── */}
        <View style={styles.quickGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.title}
              style={styles.quickTileWrap}
              onPress={() => router.push(action.path)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={action.title}
            >
              <LiquidCard style={styles.quickTile}>
                <View style={styles.quickIconCircle}>{action.icon}</View>
                <Text style={styles.quickTitle}>{action.title}</Text>
              </LiquidCard>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Pausa sugerida ── */}
        <TouchableOpacity
          style={styles.recommendCard}
          onPress={() => router.push('/views/wellness')}
          activeOpacity={0.85}
        >
          <LiquidCard style={styles.recommendGlass}>
            <View style={styles.recommendIconCircle}>
              <WindIcon size={22} />
            </View>
            <View style={styles.recommendText}>
              <Text style={styles.recommendEyebrow}>PAUSA SUGERIDA</Text>
              <Text style={styles.recommendTitle}>Ejercicio de respiración 4-7-8</Text>
              <Text style={styles.recommendDesc}>Respira, desconecta y vuelve a ti.</Text>
            </View>
            <Text style={styles.recommendChevron}>›</Text>
          </LiquidCard>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav currentTab="home" />
    </View>
  );
}
