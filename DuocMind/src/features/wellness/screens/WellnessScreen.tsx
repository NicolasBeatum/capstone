import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  daysSinceApplication,
  formatDaysAgo,
  isStressTestDue,
} from '@/features/emotional-checkin/domain/stressTestRecency';
import { useStressTestLauncher, type LastStressTest } from '@/features/emotional-checkin/hooks/useStressTestLauncher';
import { BottomNav } from '@/shared/components/BottomNav';
import { JournalIcon, PhoneIcon, StretchIcon, TimerIcon, WindIcon } from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import { styles } from './WellnessScreen.styles';

const tools = [
  {
    id: 'breathe',
    title: 'Respira',
    desc: 'Ejercicios guiados de 1 a 5 min',
    icon: <WindIcon size={26} color="#5b4a9e" />,
    tile: styles.toolBreathe,
    descColor: '#5f5878',
  },
  {
    id: 'study',
    title: 'Modo estudio',
    desc: 'Pomodoro 25/5 sin notificaciones',
    icon: <TimerIcon size={26} color="#a4511a" />,
    tile: styles.toolStudy,
    descColor: '#7a5a3c',
  },
  {
    id: 'journal',
    title: 'Diario',
    desc: 'Escribe lo que te da vueltas',
    icon: <JournalIcon size={26} color="#2f7a55" />,
    tile: styles.toolJournal,
    descColor: '#4b6e5c',
  },
  {
    id: 'stretch',
    title: 'Pausa activa',
    desc: 'Estírate entre clases, 2 min',
    icon: <StretchIcon size={26} color="#2f4ea3" />,
    tile: styles.toolStretch,
    descColor: '#4a5a86',
  },
];

function testSummary(lastStressTest: LastStressTest): { badge: string; detail: string } {
  const base = 'Escala de Estrés Percibido (PSS-10) · 10 preguntas · 3 min.';
  if (lastStressTest.status !== 'ready') {
    return { badge: 'Test Estrés Percibido', detail: base };
  }
  const { lastAppliedAt, lastLevel } = lastStressTest;
  if (!lastAppliedAt) {
    return { badge: 'Test disponible', detail: `${base} Aún no lo has respondido.` };
  }
  const last = `Último resultado: ${lastLevel ?? 'sin nivel'}, ${formatDaysAgo(daysSinceApplication(lastAppliedAt))}.`;
  return {
    badge: isStressTestDue(lastAppliedAt) ? 'Test mensual disponible' : 'Respondido este mes',
    detail: `${base} ${last}`,
  };
}

export default function WellnessScreen() {
  const router = useRouter();
  const stressTest = useStressTestLauncher();
  const summary = testSummary(stressTest.lastStressTest);

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>TU ESPACIO</Text>
        <Text style={styles.title}>Bienestar</Text>

        {/* ── Test Estrés Percibido ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{summary.badge}</Text>
          </View>
          <Text style={styles.heroTitle}>¿Cuánto estrés has sentido este mes?</Text>
          <Text style={styles.heroDesc}>{summary.detail}</Text>
          <ScalePress
            style={styles.heroButton}
            onPress={() => void stressTest.open()}
            accessibilityRole="button"
            accessibilityLabel="Comenzar Test Estrés Percibido"
          >
            <Text style={styles.heroButtonText}>Comenzar test</Text>
          </ScalePress>
        </View>

        {/* ── Herramientas rápidas ── */}
        <Text style={styles.sectionTitle}>Herramientas rápidas</Text>
        <View style={styles.toolsGrid}>
          {tools.map((tool) => (
            <View key={tool.id} style={[styles.toolTile, tool.tile]}>
              {tool.icon}
              <Text style={styles.toolTitle}>{tool.title}</Text>
              <Text style={[styles.toolDesc, { color: tool.descColor }]}>{tool.desc}</Text>
            </View>
          ))}
        </View>

        {/* ── Para esta semana ── */}
        <Text style={styles.sectionTitle}>Para esta semana</Text>
        <TouchableOpacity
          style={styles.helpCard}
          onPress={() => router.push('/wellness/crisis-resources')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="¿Necesitas hablar con alguien? Ver líneas de ayuda"
        >
          <View style={styles.helpIcon}>
            <PhoneIcon size={22} color="#9a3b1c" />
          </View>
          <View style={styles.helpText}>
            <Text style={styles.helpTitle}>¿Necesitas hablar con alguien?</Text>
            <Text style={styles.helpDesc}>Líneas de ayuda y apoyo de tu institución</Text>
          </View>
          <Text style={styles.helpArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNav currentTab="wellness" />
      {stressTest.modal}
    </View>
  );
}
