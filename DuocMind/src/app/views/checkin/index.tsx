import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomNav } from '@/shared/components/BottomNav';
import { BellIcon, EmotionFace, LeafIcon } from '@/shared/components/icons';
import { styles } from '@/shared/styles/checkin.styles';

type MoodType = 'Calmo' | 'Estresado' | 'Alegre' | 'Cansado';

/* Puntaje asociado a cada ánimo para el historial */
const MOOD_SCORES: Record<MoodType, number> = {
  Calmo: 8,
  Alegre: 9,
  Cansado: 6,
  Estresado: 4,
};

const MOOD_OPTIONS: MoodType[] = ['Calmo', 'Estresado', 'Alegre', 'Cansado'];

const EMOTION_TAGS = ['Emocionado', 'Contento', 'Motivado', 'Esperanzado', 'Tranquilo'];

interface CheckinHistoryItem {
  id: string;
  timeLabel: string;
  note: string;
  score: number;
  mood: MoodType;
  isPositive: boolean;
}

export default function CheckinScreen() {
  const [selectedMood, setSelectedMood] = useState<MoodType>('Alegre');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Contento', 'Motivado']);
  const [notes, setNotes] = useState<string>('');
  const [history, setHistory] = useState<CheckinHistoryItem[]>([
    {
      id: '1',
      timeLabel: 'Ayer',
      note: 'Tranquilo, buena energía tras descansar',
      score: 8,
      mood: 'Alegre',
      isPositive: true,
    },
    {
      id: '2',
      timeLabel: 'Hace 2 días',
      note: 'Ligeramente estresado por entrega de Física',
      score: 5,
      mood: 'Estresado',
      isPositive: false,
    },
  ]);

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    );
  };

  const handleSave = () => {
    const score = MOOD_SCORES[selectedMood];
    const detail = notes.trim() || `Sensaciones: ${selectedTags.join(', ')}`;
    const newItem: CheckinHistoryItem = {
      id: Date.now().toString(),
      timeLabel: 'Recién registrado',
      note: detail,
      score,
      mood: selectedMood,
      isPositive: score >= 6,
    };

    setHistory([newItem, ...history]);
    setNotes('');
    Alert.alert('¡Check-in guardado!', 'Tu estado emocional ha sido registrado con éxito.');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.safeArea}
    >
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header: saludo personalizado ── */}
          <View style={styles.headerRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>CM</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.greetingTitle}>¿Cómo nos sentimos el día de hoy?</Text>
              <Text style={styles.greetingSubtitle}>Espacio de autoobservación</Text>
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

          {/* ── Tarjeta de check-in ── */}
          <View style={styles.checkinCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardQuestion}>¿Cómo nos sentimos el día de hoy?</Text>
              <View style={styles.cardHeaderDecoration}>
                <LeafIcon size={22} color="#d9c97e" />
              </View>
            </View>

            {/* Selector de ánimo */}
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

            {/* Etiquetas de emociones */}
            <View style={styles.tagsWrap}>
              {EMOTION_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagPill, isSelected && styles.tagPillSelected]}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={`Etiqueta ${tag}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text style={styles.tagPillText}>{tag}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Campo de Notas */}
            <View style={styles.notesGroup}>
              <Text style={styles.notesLabel}>Cuéntanos más... (opcional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Escribe aquí qué materias o pensamientos están pesando más hoy..."
                placeholderTextColor="#b0a891"
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
                textAlignVertical="top"
              />
            </View>

            {/* Botón Guardar */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={styles.saveButtonText}>Guardar Registro</Text>
              <Text style={styles.saveButtonArrow}>→</Text>
            </TouchableOpacity>
          </View>

          {/* ── Historial Reciente ── */}
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Historial Reciente</Text>
            <Text style={styles.historySubtitle}>Últimos 7 días</Text>
          </View>

          <View style={styles.historyList}>
            {history.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyCardLeft}>
                  <View
                    style={[
                      styles.historyMoodBadge,
                      item.isPositive
                        ? styles.historyMoodBadgePositive
                        : styles.historyMoodBadgeNeutral,
                    ]}
                  >
                    <EmotionFace
                      mood={item.mood}
                      size={26}
                      fill={item.isPositive ? '#fff3cf' : '#ffe9dd'}
                    />
                  </View>
                  <View style={styles.historyTexts}>
                    <Text style={styles.historyDate}>{item.timeLabel}</Text>
                    <Text style={styles.historyNote} numberOfLines={2}>
                      {item.note}
                    </Text>
                  </View>
                </View>
                <Text style={styles.historyScore}>{item.score}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Navegación Inferior */}
        <BottomNav currentTab="checkin" />
      </View>
    </KeyboardAvoidingView>
  );
}
