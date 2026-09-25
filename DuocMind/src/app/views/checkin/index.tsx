import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BottomNav } from '@/shared/components/BottomNav';
import { LiquidBackground, LiquidCard } from '@/shared/components/glass';
import { SpeechBubble } from '@/shared/components/SpeechBubble';
import { BellIcon, EmotionFace, LeafIcon } from '@/shared/components/icons';
import { styles } from '@/shared/styles/checkin.styles';

export type MoodType = 'Muy mal' | 'Mal' | 'Neutro' | 'Bien' | 'Muy bien';

const MOOD_OPTIONS: MoodType[] = ['Muy mal', 'Mal', 'Neutro', 'Bien', 'Muy bien'];

/* Ánimos que activan el sondeo inicial de ánimo y ansiedad */
const isNegativeMood = (mood: MoodType) => mood === 'Muy mal' || mood === 'Mal';

const EMOTION_TAGS = [
  'Feliz',
  'Emocionado',
  'Contento',
  'Agradecido',
  'Satisfecho',
  'Optimista',
  'Alegre',
  'Tranquilo',
  'Motivado',
  'Cansado',
  'Ansioso',
  'Estresado',
];

export default function CheckinScreen() {
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<MoodType>('Bien');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Contento', 'Motivado']);

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    );
  };

  const handleSave = () => {
    if (isNegativeMood(selectedMood)) {
      Alert.alert(
        'Registro guardado',
        'Nos preocupa cómo te sientes. ¿Quieres realizar un sondeo rápido de ánimo y ansiedad?',
        [
          { text: 'Ahora no', style: 'cancel' },
          {
            text: 'Realizar sondeo',
            onPress: () =>
              router.push(`/views/tests/daily-test?mood=${encodeURIComponent(selectedMood)}`),
          },
        ],
      );
      return;
    }

    Alert.alert('¡Check-in guardado!', 'Tu estado emocional ha sido registrado con éxito.');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.safeArea}
    >
      <View style={styles.container}>
        <LiquidBackground />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header: pregunta principal ── */}
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.greetingTitle}>¿Cómo te sientes hoy?</Text>
              <Text style={styles.greetingSubtitle}>Espacio de autoobservación</Text>
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

          {/* ── Selector de ánimo ── */}
          <LiquidCard style={styles.moodCardContainer}>
            <View style={styles.moodCardDecoration}>
              <LeafIcon size={20} />
            </View>
            <View style={styles.moodGrid}>
              {MOOD_OPTIONS.map((mood) => {
                const isSelected = selectedMood === mood;
                return (
                  <TouchableOpacity
                    key={mood}
                    style={[styles.moodCard, isSelected && styles.moodCardSelected]}
                    onPress={() => setSelectedMood(mood)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={`Seleccionar estado ${mood}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={styles.moodIcon}>
                      <EmotionFace mood={mood} size={34} />
                    </View>
                    <Text
                      style={[
                        styles.moodLabel,
                        isSelected && styles.moodLabelSelected,
                      ]}
                    >
                      {mood}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </LiquidCard>

          {/* ── Emociones relacionadas ── */}
          <Text style={styles.tagsSectionLabel}>
            Selecciona una o más emociones relacionadas (opcional)
          </Text>
          <View style={styles.tagsWrap}>
            {EMOTION_TAGS.map((tag) => (
              <SpeechBubble
                key={tag}
                label={tag}
                selected={selectedTags.includes(tag)}
                onPress={() => toggleTag(tag)}
              />
            ))}
          </View>

          {/* ── Botón confirmar ── */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <Text style={styles.saveButtonText}>Confirmar Registro de Emoción</Text>
            <Text style={styles.saveButtonArrow}>→</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Navegación Inferior */}
        <BottomNav currentTab="checkin" />
      </View>
    </KeyboardAvoidingView>
  );
}
