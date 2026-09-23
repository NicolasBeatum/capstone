import React, { useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from '../../../shared/styles/stress-test.styles';
import { useRouter } from 'expo-router';
import { BottomNav } from '../../../shared/components/BottomNav';

const options = ['Nunca', 'Rara vez', 'A veces', 'Frecuentemente', 'Siempre'];

const questions = [
  {
    id: 1,
    title: '┬┐Con qu├® frecuencia te has sentido m├ís dispuesto(a) para iniciar tus actividades acad├®micas?',
    helper: 'Considera tu disposici├│n y energ├¡a para comenzar tareas o clases en las ├║ltimas semanas.',
  },
  {
    id: 2,
    title: '┬┐Con qu├® frecuencia te ha costado mantener la energ├¡a para continuar con tus responsabilidades?',
    helper: 'Piensa en lo dif├¡cil que te result├│ mantenerte enfocado y con ├ínimo para seguir.',
  },
  {
    id: 3,
    title: '┬┐Con qu├® frecuencia te has sentido molesto(a) o frustrado(a) por obst├ículos en tus trabajos o entregas?',
    helper: 'Incluye la tensi├│n que aparece ante dificultades, retrasos o exigencias acad├®micas.',
  },
  {
    id: 4,
    title: '┬┐Con qu├® frecuencia la presi├│n por tus responsabilidades te ha dificultado concentrarte?',
    helper: 'Eval├║a si la preocupaci├│n o la carga te ha afectado el foco y la calma.',
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
      Alert.alert('Respuesta requerida', 'Selecciona una opci├│n para continuar.');
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
          <Text style={styles.headerTitle}>Equilibrio Acad├®mico</Text>
          <TouchableOpacity onPress={handleClose} activeOpacity={0.8}>
            <Text style={styles.closeButton}>├ù</Text>
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
              Estamos revisando tus respuestas para identificar la emoci├│n predominante.
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
          <Text style={styles.headerTitle}>Equilibrio Acad├®mico</Text>
          <TouchableOpacity onPress={handleClose} activeOpacity={0.8}>
            <Text style={styles.closeButton}>├ù</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.resultCard}>
            <View style={styles.resultHeaderRow}>
              <Text style={styles.resultEyebrow}>ORIENTACI├ôN</Text>
              <View style={styles.badgeChip}>
                <Text style={styles.badgeChipText}>RESULTADO</Text>
              </View>
            </View>

            <Text style={styles.resultTitle}>Emoci├│n predominante</Text>

            <View style={styles.resultEmotionPanel}>
              <View style={styles.resultMoodBadge}>
                <Text style={styles.resultMoodBadgeText}>­ƒÿä</Text>
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

            <Text style={styles.resultMessage}>┬┐Esta orientaci├│n coincide con c├│mo te sientes?</Text>

            <View style={styles.resultButtonsRow}>
              <TouchableOpacity style={styles.acceptButton} activeOpacity={0.85}>
                <Text style={styles.acceptButtonText}>S├¡, es acertado</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.rejectButton} activeOpacity={0.85}>
                <Text style={styles.rejectButtonText}>No coincide con c├│mo me siento</Text>
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
        <Text style={styles.headerTitle}>Equilibrio Acad├®mico</Text>
        <TouchableOpacity onPress={handleClose} activeOpacity={0.8}>
          <Text style={styles.closeButton}>├ù</Text>
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
