import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarInitial}>CM</Text>
              </View>
              <View>
                <Text style={styles.screenTitle}>Check-in Emocional</Text>
                <Text style={styles.screenSubtitle}>Espacio de autoobservación</Text>
              </View>
            </View>
            <Text style={styles.quoteIcon}>”</Text>
          </View>

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f7',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a2b44',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f3e7a0',
    marginRight: 12,
  },
  avatarInitial: {
    color: '#f3e7a0',
    fontSize: 14,
    fontWeight: '700',
  },
  screenTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a2b44',
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  quoteIcon: {
    fontSize: 28,
    color: '#cbd5e1',
    fontWeight: 'bold',
  },
  checkinCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#1a2b44',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a2b44',
    lineHeight: 20,
  },
  cardHelpText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 16,
  },
  scaleContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scaleExtremesOverwhelmed: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f43f5e',
  },
  scaleExtremesCalm: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1a2b44',
  },
  numbersGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  numberPill: {
    width: 28,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberPillActive: {
    backgroundColor: '#1a2b44',
    borderColor: '#1a2b44',
  },
  numberPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  numberPillTextActive: {
    color: '#f3e7a0',
  },
  scoreResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreResultLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginRight: 8,
  },
  scorePill: {
    backgroundColor: '#fbf6dc',
    borderWidth: 1,
    borderColor: '#f3e7a0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scorePillValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1a2b44',
  },
  notesGroup: {
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a2b44',
    marginBottom: 6,
  },
  notesInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    fontSize: 12,
    color: '#1e293b',
    minHeight: 80,
  },
  saveButton: {
    backgroundColor: '#1a2b44',
    borderRadius: 16,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonIcon: {
    color: '#f3e7a0',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  historySection: {
    marginTop: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a2b44',
  },
  historySubtitle: {
    fontSize: 10,
    color: '#94a3b8',
  },
  historyList: {
    gap: 8,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  historyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  historyMoodBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  historyMoodBadgePositive: {
    backgroundColor: '#fbf6dc',
  },
  historyMoodBadgeNeutral: {
    backgroundColor: '#ffe4e6',
  },
  historyEmoji: {
    fontSize: 18,
  },
  historyTexts: {
    flex: 1,
  },
  historyDate: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e293b',
  },
  historyNote: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  historyScorePill: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyScoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1a2b44',
  },
});

