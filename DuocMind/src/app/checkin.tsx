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
import { styles } from '../shared/styles/checkin.styles';
import { AppHeader } from '../shared/components/AppHeader';
import { BottomNav } from '../shared/components/BottomNav';

interface CheckinHistoryItem {
  id: string;
  timeLabel: string;
  note: string;
  score: number;
  moodIcon: string;
  isPositive: boolean;
}

export default function CheckinScreen() {
  const [stressScore, setStressScore] = useState<number>(7);
  const [notes, setNotes] = useState<string>('');
  const [history, setHistory] = useState<CheckinHistoryItem[]>([
    {
      id: '1',
      timeLabel: 'Ayer',
      note: 'Tranquilo, buena energía tras descansar',
      score: 8,
      moodIcon: '😊',
      isPositive: true,
    },
    {
      id: '2',
      timeLabel: 'Hace 2 días',
      note: 'Ligeramente estresado por entrega de Física',
      score: 5,
      moodIcon: '😐',
      isPositive: false,
    },
  ]);

  const handleSave = () => {
    const newItem: CheckinHistoryItem = {
      id: Date.now().toString(),
      timeLabel: 'Recién registrado',
      note: notes.trim() || 'Check-in guardado con éxito',
      score: stressScore,
      moodIcon: stressScore >= 7 ? '😊' : stressScore >= 5 ? '😐' : '😫',
      isPositive: stressScore >= 6,
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
          {/* Header con Avatar y Menú de Perfil */}
          <AppHeader title="Check-in Emocional" subtitle="Espacio de autoobservación" />

          {/* Tarjeta Interactiva de Check-in */}
          <View style={styles.checkinCard}>
            <Text style={styles.cardQuestion}>
              ¿Cómo te sientes respecto a tu carga académica hoy?
            </Text>
            <Text style={styles.cardHelpText}>
              Toma 3 respiraciones profundas antes de responder.
            </Text>

            {/* Selector de Puntaje 1-10 */}
            <View style={styles.scaleContainer}>
              <View style={styles.scaleLabels}>
                <Text style={styles.scaleExtremesOverwhelmed}>😫 Abrumado (1)</Text>
                <Text style={styles.scaleExtremesCalm}>Bajo control (10) 😊</Text>
              </View>

              <View style={styles.numbersGrid}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const isSelected = stressScore === num;
                  return (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.numberPill,
                        isSelected && styles.numberPillActive,
                      ]}
                      onPress={() => setStressScore(num)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.numberPillText,
                          isSelected && styles.numberPillTextActive,
                        ]}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.scoreResultRow}>
                <Text style={styles.scoreResultLabel}>TU PUNTAJE ACTUAL:</Text>
                <View style={styles.scorePill}>
                  <Text style={styles.scorePillValue}>{stressScore} / 10</Text>
                </View>
              </View>
            </View>

            {/* Campo de Notas */}
            <View style={styles.notesGroup}>
              <Text style={styles.notesLabel}>Cuéntanos más... (opcional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Escribe aquí qué materias o pensamientos están pesando más hoy..."
                placeholderTextColor="#94a3b8"
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
              <Text style={styles.saveButtonIcon}>✓</Text>
              <Text style={styles.saveButtonText}>Guardar Registro</Text>
            </TouchableOpacity>
          </View>

          {/* Historial Reciente */}
          <View style={styles.historySection}>
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
                      <Text style={styles.historyEmoji}>{item.moodIcon}</Text>
                    </View>
                    <View style={styles.historyTexts}>
                      <Text style={styles.historyDate}>{item.timeLabel}</Text>
                      <Text style={styles.historyNote} numberOfLines={2}>
                        {item.note}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.historyScorePill}>
                    <Text style={styles.historyScoreText}>{item.score}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Navegación Inferior */}
        <BottomNav currentTab="checkin" />
      </View>
    </KeyboardAvoidingView>
  );
}
