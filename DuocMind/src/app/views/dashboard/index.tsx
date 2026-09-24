import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomNav } from '@/shared/components/BottomNav';
import { ProgressRing } from '@/shared/components/ProgressRing';
import {
  BellIcon,
  BoltIcon,
  ClipboardIcon,
  EmotionFace,
  GradCapIcon,
  LeafIcon,
  SparkleIcon,
  WindIcon,
} from '@/shared/components/icons';
import { styles } from '@/shared/styles/dashboard.styles';

type MoodType = 'Calmo' | 'Estresado' | 'Alegre' | 'Cansado';

export default function DashboardScreen() {
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<MoodType>('Calmo');

  const moods: MoodType[] = ['Calmo', 'Estresado', 'Alegre', 'Cansado'];

  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Header: saludo personalizado ── */}
        <View style={styles.headerRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>CM</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.greetingTitle}>Hola, Camila</Text>
            <Text style={styles.greetingSubtitle}>Un paso a la vez</Text>
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

        {/* ── Check-in emocional ── */}
        <View style={styles.moodCard}>
          <View style={styles.moodCardHeader}>
            <Text style={styles.moodCardEyebrow}>¿CÓMO TE SIENTES HOY?</Text>
            <View style={styles.moodCardDecoration}>
              <LeafIcon size={18} />
            </View>
          </View>

          <View style={styles.moodGrid}>
            {moods.map((mood) => {
              const isSelected = selectedMood === mood;
              return (
                <TouchableOpacity
                  key={mood}
                  style={[styles.moodPill, isSelected && styles.moodPillSelected]}
                  onPress={() => setSelectedMood(mood)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`Seleccionar estado ${mood}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={styles.moodIcon}>
                    <EmotionFace mood={mood} size={30} />
                  </View>
                  <Text
                    style={[
                      styles.moodPillLabel,
                      isSelected && styles.moodPillLabelSelected,
                    ]}
                  >
                    {mood}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/views/checkin')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Registrar check-in</Text>
            <Text style={styles.primaryButtonArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* ── Tu día ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Tu día</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.sectionLink}>Hoy ⌄</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gaugesRow}>
          <View style={styles.gaugeCard}>
            <ProgressRing value={70} color="#f2c14e" />
            <View style={styles.gaugeText}>
              <View style={styles.gaugeIcon}>
                <GradCapIcon size={16} />
              </View>
              <Text style={styles.gaugeTitle}>Carga académica</Text>
              <Text style={styles.gaugeStatus}>3 de 5 materias</Text>
            </View>
          </View>

          <View style={styles.gaugeCard}>
            <ProgressRing value={60} color="#f2c14e" />
            <View style={styles.gaugeText}>
              <View style={styles.gaugeIcon}>
                <BoltIcon size={16} />
              </View>
              <Text style={styles.gaugeTitle}>Nivel de energía</Text>
              <Text style={styles.gaugeStatus}>Regular</Text>
            </View>
          </View>
        </View>

        {/* ── Test diario ── */}
        <View style={styles.testBanner}>
          <View style={styles.testBannerContent}>
            <View style={styles.testBadge}>
              <Text style={styles.testBadgeText}>TEST DIARIO</Text>
            </View>
            <Text style={styles.testBannerTitle}>¡Realiza tu test diario!</Text>
            <Text style={styles.testBannerDesc}>
              Mide tu sobrecarga cognitiva en 3 minutos.
            </Text>
            <TouchableOpacity
              style={styles.testBannerButton}
              onPress={() => router.push('/views/tests/daily-test')}
              activeOpacity={0.85}
            >
              <Text style={styles.testBannerButtonText}>Realizar test diario</Text>
              <Text style={styles.testBannerButtonArrow}>→</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.testBannerIllustration}>
            <SparkleIcon size={12} />
            <ClipboardIcon size={52} />
            <SparkleIcon size={9} color="#e8a93c" />
          </View>
        </View>

        {/* ── Para ti ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Para ti</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.sectionLink}>Ver más →</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.recommendCard}
          onPress={() => router.push('/views/wellness')}
          activeOpacity={0.85}
        >
          <View style={styles.recommendIconCircle}>
            <WindIcon size={22} />
          </View>
          <View style={styles.recommendText}>
            <Text style={styles.recommendTitle}>Pausa de 2 minutos</Text>
            <Text style={styles.recommendDesc}>Respira, desconecta y vuelve a ti.</Text>
          </View>
          <Text style={styles.recommendChevron}>›</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav currentTab="home" />
    </View>
  );
}
