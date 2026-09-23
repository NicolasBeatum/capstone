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
import { styles } from '../../../shared/styles/checkin.styles';
import { AppHeader } from '../../../shared/components/AppHeader';
import { BottomNav } from '../../../shared/components/BottomNav';

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
      note: 'Tranquilo, buena energ├¡a tras descansar',
      score: 8,
      moodIcon: '­ƒÿè',
      isPositive: true,
    },
    {
      id: '2',
      timeLabel: 'Hace 2 d├¡as',
      note: 'Ligeramente estresado por entrega de F├¡sica',
      score: 5,
      moodIcon: '­ƒÿÉ',
      isPositive: false,
    },
  ]);

  const handleSave = () => {
    const newItem: CheckinHistoryItem = {
      id: Date.now().toString(),
      timeLabel: 'Reci├®n registrado',
      note: notes.trim() || 'Check-in guardado con ├®xito',
      score: stressScore,
      moodIcon: stressScore >= 7 ? '­ƒÿè' : stressScore >= 5 ? '­ƒÿÉ' : '­ƒÿ½',
      isPositive: stressScore >= 6,
    };

    setHistory([newItem, ...history]);
    setNotes('');
    Alert.alert('┬íCheck-in guardado!', 'Tu estado emocional ha sido registrado con ├®xito.');
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
          {/* Header con Avatar y Men├║ de Perfil */}
          <AppHeader title="Check-in Emocional" subtitle="Espacio de autoobservaci├│n" />

          {/* Tarjeta Interactiva de Check-in */}
          <View style={styles.checkinCard}>
            <Text style={styles.cardQuestion}>
              ┬┐C├│mo te sientes respecto a tu carga acad├®mica hoy?
            </Text>
            <Text style={styles.cardHelpText}>
              Toma 3 respiraciones profundas antes de responder.
            </Text>

            {/* Selector de Puntaje 1-10 */}
            <View style={styles.scaleContainer}>
              <View style={styles.scaleLabels}>
                <Text style={styles.scaleExtremesOverwhelmed}>­ƒÿ½ Abrumado (1)</Text>
                <Text style={styles.scaleExtremesCalm}>Bajo control (10) ­ƒÿè</Text>
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
              <Text style={styles.notesLabel}>Cu├®ntanos m├ís... (opcional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Escribe aqu├¡ qu├® materias o pensamientos est├ín pesando m├ís hoy..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
                textAlignVertical="top"
              />
            </View>

            {/* Bot├│n Guardar */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={styles.saveButtonIcon}>Ô£ô</Text>
              <Text style={styles.saveButtonText}>Guardar Registro</Text>
            </TouchableOpacity>
          </View>

          {/* Historial Reciente */}
          <View style={styles.historySection}>
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>Historial Reciente</Text>
              <Text style={styles.historySubtitle}>├Ültimos 7 d├¡as</Text>
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

        {/* Navegaci├│n Inferior */}
        <BottomNav currentTab="checkin" />
      </View>
    </KeyboardAvoidingView>
  );
}
