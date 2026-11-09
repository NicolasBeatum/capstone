import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  daysSinceApplication,
  formatDaysAgo,
  isStressTestDue,
} from '@/features/emotional-checkin/domain/stressTestRecency';
import { useStressTestLauncher, type LastStressTest } from '@/features/emotional-checkin/hooks/useStressTestLauncher';
import { BottomNav } from '@/shared/components/BottomNav';
import { PhoneIcon, TicketIcon } from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import { Reveal } from '@/shared/motion/Reveal';
import { ResourcesSection } from '../components/ResourcesSection';
import { styles } from './WellnessScreen.styles';

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
        <Reveal>
          <Text style={styles.eyebrow}>TU ESPACIO</Text>
          <Text style={styles.title}>Bienestar</Text>
        </Reveal>

        <Reveal index={1}>
          <ScalePress
            style={styles.eventsCard}
            onPress={() => router.push('/events')}
            accessibilityRole="button"
            accessibilityLabel="Eventos, ver calendario de actividades"
          >
            <View style={styles.helpIcon}><TicketIcon size={22} color="#1a2b44" /></View>
            <View style={styles.helpText}>
              <Text style={styles.eventsTitle}>Eventos</Text>
              <Text style={styles.eventsDesc}>Actividades, encuentros y talleres para tu agenda</Text>
            </View>
            <Text style={styles.eventsArrow}>›</Text>
          </ScalePress>
        </Reveal>

        {/* ── Test Estrés Percibido ── */}
        <Reveal index={1}>
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
        </Reveal>

        {/* ── Recursos por categoría ── */}
        <ResourcesSection
          revealIndex={2}
          onOpenResource={(resourceId) =>
            router.push({ pathname: '/wellness/resources/[id]', params: { id: String(resourceId) } })
          }
        />

        {/* ── Para esta semana ── */}
        <Reveal index={3}>
          <Text style={styles.sectionTitle}>Para esta semana</Text>
          <ScalePress
            style={styles.helpCard}
            onPress={() => router.push('/wellness/crisis-resources')}
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
          </ScalePress>
        </Reveal>
      </ScrollView>
      <BottomNav currentTab="wellness" />
      {stressTest.modal}
    </View>
  );
}
