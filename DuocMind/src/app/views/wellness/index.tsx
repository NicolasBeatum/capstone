import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/shared/components/AppHeader';
import { BottomNav } from '@/shared/components/BottomNav';
import { GlassCard, LiquidBackground, LiquidPanel } from '@/shared/components/glass';
import { ClipboardIcon, MeditationIcon, MoonIcon, SparkleIcon, TimerIcon } from '@/shared/components/icons';
import { styles } from '@/shared/styles/wellness.styles';

const tips = [
  {
    id: 'pomodoro',
    title: 'Técnica Pomodoro 25/5',
    desc: 'Para días de alta carga cognitiva. Alterna trabajo concentrado con pausas sin pantallas.',
    icon: <TimerIcon size={22} color="#b95c3b" />,
    iconBg: '#f7dcd2',
  },
  {
    id: 'meditation',
    title: 'Meditación Guiada (3 min)',
    desc: 'Reduce la ansiedad pre-examen centrando tu atención en la respiración diafragmática.',
    icon: <MeditationIcon size={22} color="#c1912c" />,
    iconBg: '#f6ead0',
  },
  {
    id: 'sleep',
    title: 'Higiene del Sueño',
    desc: 'Evita trasnochar repasando materia. La consolidación de la memoria ocurre en el sueño profundo.',
    icon: <MoonIcon size={22} color="#6b5fbe" />,
    iconBg: '#e7e2f6',
  },
];

export default function WellnessScreen() {
  const router = useRouter();

  return (
    <View style={styles.safeArea}>
      <LiquidBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AppHeader title="Centro de Bienestar" subtitle="Herramientas y descanso" />

        <GlassCard style={styles.centerCard}>
          <Text style={styles.centerCardTitle}>Tu Centro de Bienestar</Text>
          <Text style={styles.centerCardSubtitle}>Herramientas y descanso</Text>
          <LiquidPanel from="#f9e9b8" to="#f3d98a" radius={18} style={styles.testCard}>
            <View style={styles.testCardContent}>
              <Text style={styles.testCardTitle}>Test emocional</Text>
              <Text style={styles.testCardDesc}>
                Identifica tu emoción del día y recibe una mirada rápida sobre tu estado general.
              </Text>
            </View>
            <View style={styles.testIllustration}>
              <SparkleIcon size={10} />
              <ClipboardIcon size={46} />
              <SparkleIcon size={8} color="#e8a93c" />
            </View>
          </LiquidPanel>
        </GlassCard>

        <View style={styles.tipsHeader}>
          <Text style={styles.tipsTitle}>Tips Personalizados</Text>
          <Text style={styles.tipsBadge}>Basado en tu estado</Text>
        </View>
        <View style={styles.tipsGrid}>
          {tips.map((tip) => (
            <View key={tip.id} style={styles.tipCardWrap}>
              <GlassCard style={styles.tipCard}>
                <View style={[styles.tipIconBox, { backgroundColor: tip.iconBg }]}>{tip.icon}</View>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDesc}>{tip.desc}</Text>
              </GlassCard>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => router.push('/views/tests/daily-test')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Comenzar test emocional"
        >
          <Text style={styles.ctaText}>Comenzar Test</Text>
          <Text style={styles.ctaArrow}>→</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNav currentTab="wellness" />
    </View>
  );
}
