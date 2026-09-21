import React, { useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BottomNav } from '../shared/components/BottomNav';

const options = ['Nunca', 'Rara vez', 'A veces', 'Frecuentemente', 'Siempre'];

const questions = [
  {
    id: 1,
    title: '¿Con qué frecuencia te has sentido más dispuesto(a) para iniciar tus actividades académicas?',
    helper: 'Considera tu disposición y energía para comenzar tareas o clases en las últimas semanas.',
  },
  {
    id: 2,
    title: '¿Con qué frecuencia te ha costado mantener la energía para continuar con tus responsabilidades?',
    helper: 'Piensa en lo difícil que te resultó mantenerte enfocado y con ánimo para seguir.',
  },
  {
    id: 3,
    title: '¿Con qué frecuencia te has sentido molesto(a) o frustrado(a) por obstáculos en tus trabajos o entregas?',
    helper: 'Incluye la tensión que aparece ante dificultades, retrasos o exigencias académicas.',
  },
  {
    id: 4,
    title: '¿Con qué frecuencia la presión por tus responsabilidades te ha dificultado concentrarte?',
    helper: 'Evalúa si la preocupación o la carga te ha afectado el foco y la calma.',
  },
];

export default function StressTestScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const spinAnim = useState(new Animated.Value(0))[0];

  React.useEffect(() => {
    if (!isGenerating) return;

    const animation = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();
    return () => animation.stop();
  }, [isGenerating, spinAnim]);

  const currentQuestion = questions[currentStep];
  const progress = useMemo(() => ((currentStep + 1) / questions.length) * 100, [currentStep]);
  const selectedAnswer = answers[currentQuestion.id];

  const handleSelect = (optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const handleContinue = () => {
    if (selectedAnswer === undefined) {
      Alert.alert('Respuesta requerida', 'Selecciona una opción para continuar.');
      return;
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowResult(true);
    }, 1800);
  };

  const handleClose = () => {
    router.back();
  };

  if (isGenerating) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Equilibrio Académico</Text>
          <TouchableOpacity onPress={handleClose} activeOpacity={0.8}>
            <Text style={styles.closeButton}>×</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <Animated.View
              style={[
                styles.loadingOrb,
                {
                  transform: [
                    {
                      rotate: spinAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            />
            <Text style={styles.loadingTitle}>Analizando coincidencias</Text>
            <Text style={styles.loadingText}>
              Estamos revisando tus respuestas para identificar la emoción predominante.
            </Text>
          </View>
        </View>

        <BottomNav currentTab="home" />
      </View>
    );
  }

  if (showResult) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Equilibrio Académico</Text>
          <TouchableOpacity onPress={handleClose} activeOpacity={0.8}>
            <Text style={styles.closeButton}>×</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.resultCard}>
            <View style={styles.resultHeaderRow}>
              <Text style={styles.resultEyebrow}>DIAGNÓSTICO</Text>
              <View style={styles.badgeChip}>
                <Text style={styles.badgeChipText}>IA</Text>
              </View>
            </View>

            <Text style={styles.resultTitle}>Emoción predominante</Text>

            <View style={styles.resultEmotionPanel}>
              <View style={styles.resultMoodBadge}>
                <Text style={styles.resultMoodBadgeText}>😄</Text>
              </View>
              <View style={styles.resultEmotionTextWrap}>
                <Text style={styles.resultEmotionText}>Feliz</Text>
                <Text style={styles.resultEmotionSub}>Se observa un estado emocional principalmente positivo.</Text>
              </View>
            </View>

            <View style={styles.resultPercentBox}>
              <Text style={styles.resultPercent}>67%</Text>
              <Text style={styles.resultPercentLabel}>de coincidencia</Text>
            </View>

            <Text style={styles.resultMessage}>¿Te parece este diagnóstico acertado?</Text>

            <View style={styles.resultButtonsRow}>
              <TouchableOpacity style={styles.acceptButton} activeOpacity={0.85}>
                <Text style={styles.acceptButtonText}>Sí, es acertado</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.rejectButton} activeOpacity={0.85}>
                <Text style={styles.rejectButtonText}>No coincide con cómo me siento</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <BottomNav currentTab="home" />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Equilibrio Académico</Text>
        <TouchableOpacity onPress={handleClose} activeOpacity={0.8}>
          <Text style={styles.closeButton}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.panel}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>TEST EMOCIONAL</Text>
            <Text style={styles.progressValue}>{currentStep + 1} / {questions.length}</Text>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>

          <View style={styles.questionWrap}>
            <Text style={styles.questionText}>{currentQuestion.title}</Text>
            <Text style={styles.helperText}>{currentQuestion.helper}</Text>
          </View>

          <View style={styles.optionsList}>
            {options.map((option, index) => {
              const isSelected = selectedAnswer === index;

              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                  onPress={() => handleSelect(index)}
                  activeOpacity={0.9}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option}</Text>
                  <View style={[styles.selector, isSelected && styles.selectorSelected]}>
                    {isSelected && <View style={styles.selectorInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleContinue} activeOpacity={0.9}>
            <Text style={styles.primaryButtonText}>
              {currentStep === questions.length - 1 ? 'Finalizar' : 'Siguiente'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNav currentTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef2f4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a2b44',
  },
  closeButton: {
    fontSize: 28,
    color: '#1a2b44',
    fontWeight: '600',
    lineHeight: 28,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingBottom: 120,
    justifyContent: 'center',
  },
  panel: {
    backgroundColor: '#f6f7f7',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#dfe7eb',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    shadowColor: '#1a2b44',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a2b44',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#dfe5ea',
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#1a2b44',
  },
  questionWrap: {
    marginBottom: 18,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a2b44',
    lineHeight: 25,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#64748b',
  },
  optionsList: {
    gap: 10,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f3f5f6',
    borderWidth: 1,
    borderColor: '#dfe5ea',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 15,
  },
  optionButtonSelected: {
    backgroundColor: '#f7f2dc',
    borderColor: '#d4b43c',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a2b44',
  },
  optionTextSelected: {
    color: '#1a2b44',
  },
  selector: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#c9d2db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorSelected: {
    backgroundColor: '#1a2b44',
    borderColor: '#1a2b44',
  },
  selectorInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  primaryButton: {
    marginTop: 26,
    backgroundColor: '#1a2b44',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingBottom: 80,
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#1a2b44',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  loadingOrb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#1a2b44',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#dfe7eb',
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a2b44',
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 22,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resultHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
  },
  badgeChip: {
    backgroundColor: '#1a2b44',
    borderRadius: 999,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeChipText: {
    color: '#f8fafc',
    fontSize: 10,
    fontWeight: '800',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a2b44',
    lineHeight: 24,
    marginBottom: 16,
  },
  resultEmotionPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 18,
  },
  resultEmotionTextWrap: {
    flex: 1,
  },
  resultMoodBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#edf2f7',
    borderWidth: 1,
    borderColor: '#dfe7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultMoodBadgeText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1a2b44',
  },
  resultEmotionText: {
    fontSize: 25,
    fontWeight: '800',
    color: '#1a2b44',
  },
  resultEmotionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 16,
  },
  resultPercentBox: {
    backgroundColor: '#f3f6f8',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 18,
  },
  resultPercent: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1a2b44',
  },
  resultPercentLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  resultMessage: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a2b44',
    textAlign: 'center',
    marginBottom: 16,
  },
  resultButtonsRow: {
    gap: 10,
  },
  acceptButton: {
    backgroundColor: '#1a2b44',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  rejectButton: {
    backgroundColor: '#edf2f7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d8e0e8',
  },
  rejectButtonText: {
    color: '#1a2b44',
    fontSize: 15,
    fontWeight: '700',
  },
});
