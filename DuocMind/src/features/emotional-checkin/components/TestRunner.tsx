import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScalePress } from '@/shared/components/ScalePress';
import { ClipboardIcon, SparkleIcon } from '@/shared/components/icons';
import { styles } from '@/shared/styles/daily-test.styles';
import type { ScaleOption, TestQuestion } from '../data/types';

interface TestRunnerProps {
  /** Etiqueta sobre la barra de progreso, ej. 'TEST DE ÁNIMO (PHQ-9)' */
  eyebrow: string;
  /** Subtítulo del header con el nombre del instrumento */
  subtitle: string;
  questions: TestQuestion[];
  options: ScaleOption[];
  /** Se invoca en cada respuesta; permite interceptar ítems críticos (PHQ-9 ítem 9) */
  onAnswer?: (questionId: number, value: number) => void;
  onComplete: (answers: Record<number, number>) => void;
}

export function TestRunner({ eyebrow, subtitle, questions, options, onAnswer, onComplete }: TestRunnerProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const currentQuestion = questions[currentStep];
  const progress = useMemo(
    () => ((currentStep + 1) / questions.length) * 100,
    [currentStep, questions.length],
  );
  const selectedAnswer = answers[currentQuestion.id];
  const isLastStep = currentStep === questions.length - 1;

  /* La barra avanza con una transición suave en lugar de saltar de golpe */
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 450,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const handleSelect = (option: ScaleOption) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option.value }));
    onAnswer?.(currentQuestion.id, option.value);
  };

  const handleContinue = () => {
    if (selectedAnswer === undefined) {
      Alert.alert('Respuesta requerida', 'Selecciona una opción para continuar.');
      return;
    }

    if (!isLastStep) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    onComplete(answers);
  };

  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerIdentity}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>CM</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Equilibrio Académico</Text>
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.closeButton}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.panel}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>{eyebrow}</Text>
            <Text style={styles.progressValue}>
              {currentStep + 1} / {questions.length}
            </Text>
          </View>

          <View style={styles.progressBarTrack}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          <View style={styles.questionRow}>
            <View style={styles.questionWrap}>
              <Text style={styles.questionText}>{currentQuestion.title}</Text>
              {currentQuestion.helper ? (
                <Text style={styles.helperText}>{currentQuestion.helper}</Text>
              ) : null}
            </View>
            <View style={styles.questionIllustration}>
              <SparkleIcon size={10} />
              <ClipboardIcon size={42} />
              <SparkleIcon size={8} color="#e8a93c" />
            </View>
          </View>

          <View style={styles.optionsList}>
            {options.map((option) => {
              const isSelected = selectedAnswer === option.value;

              return (
                <ScalePress
                  key={option.label}
                  style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                  onPress={() => handleSelect(option)}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option.label}
                  </Text>
                  <View style={[styles.selector, isSelected && styles.selectorSelected]}>
                    {isSelected && <View style={styles.selectorInner} />}
                  </View>
                </ScalePress>
              );
            })}
          </View>

          <ScalePress style={styles.primaryButton} onPress={handleContinue}>
            <Text style={styles.primaryButtonText}>{isLastStep ? 'Finalizar' : 'Siguiente'} →</Text>
          </ScalePress>
        </View>
      </ScrollView>
    </>
  );
}
