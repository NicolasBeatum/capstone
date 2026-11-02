import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ScalePress } from '@/shared/components/ScalePress';
import { CheckIcon } from '@/shared/components/Icons';
import { styles } from '../screens/DailyTestScreen.styles';
import type { ScaleOption, TestQuestion } from '../domain/types';
import { getQuestionOptions } from '../domain/questionOptions';
import { TestHeader } from './TestHeader';

interface TestRunnerProps {
  /** Nombre del instrumento, mostrado en el encabezado */
  subtitle: string;
  questions: TestQuestion[];
  options: ScaleOption[];
  /** Se invoca en cada respuesta; permite interceptar ítems críticos */
  onAnswer?: (questionId: number, value: number, question: TestQuestion) => void;
  onComplete: (answers: Record<number, number>) => void;
}

/* Punto de la opción: crece con la frecuencia para que la escala se lea de un vistazo. */
const DOT_MIN = 8;
const DOT_GROWTH = 12;

export function TestRunner({ subtitle, questions, options, onAnswer, onComplete }: TestRunnerProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const currentQuestion = questions[currentStep];
  const currentOptions = getQuestionOptions(currentQuestion, options);
  const selectedAnswer = answers[currentQuestion.id];
  const isLastStep = currentStep === questions.length - 1;
  const canContinue = selectedAnswer !== undefined;

  const handleSelect = (option: ScaleOption) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option.value }));
    onAnswer?.(currentQuestion.id, option.value, currentQuestion);
  };

  const handleContinue = () => {
    if (!canContinue) return;
    if (!isLastStep) {
      setCurrentStep((prev) => prev + 1);
      return;
    }
    onComplete(answers);
  };

  return (
    <>
      <TestHeader title={subtitle} detail={`Pregunta ${currentStep + 1} de ${questions.length}`} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Un segmento por pregunta: el test es una secuencia y se ve cuánto falta. */}
        <View
          style={styles.progressRow}
          accessibilityRole="progressbar"
          accessibilityLabel="Avance del test"
          accessibilityValue={{ min: 1, max: questions.length, now: currentStep + 1 }}
        >
          {questions.map((question, index) => (
            <View
              key={question.id}
              style={[
                styles.progressSegment,
                index < currentStep && styles.progressSegmentDone,
                index === currentStep && styles.progressSegmentCurrent,
              ]}
            />
          ))}
        </View>

        <Text style={styles.questionText}>{currentQuestion.title}</Text>
        {currentQuestion.helper ? (
          <Text style={styles.helperText}>{currentQuestion.helper}</Text>
        ) : null}

        <View style={styles.optionsList}>
          {currentOptions.map((option, index) => {
            const isSelected = selectedAnswer === option.value;
            const dot =
              DOT_MIN + (currentOptions.length > 1 ? (index * DOT_GROWTH) / (currentOptions.length - 1) : 0);

            return (
              <ScalePress
                key={option.label}
                style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
                onPress={() => handleSelect(option)}
                accessibilityRole="radio"
                accessibilityLabel={option.label}
                accessibilityState={{ checked: isSelected }}
              >
                <View style={styles.optionDotSlot}>
                  <View
                    style={[
                      styles.optionDot,
                      { width: dot, height: dot, borderRadius: dot / 2 },
                      isSelected && styles.optionDotSelected,
                    ]}
                  />
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option.label}
                </Text>
                {isSelected ? <CheckIcon size={16} color="#2b6b50" /> : null}
              </ScalePress>
            );
          })}
        </View>

        <View style={styles.actionsRow}>
          {currentStep > 0 ? (
            <ScalePress
              style={styles.backButton}
              onPress={() => setCurrentStep((prev) => prev - 1)}
              accessibilityRole="button"
              accessibilityLabel="Pregunta anterior"
            >
              <Text style={styles.backButtonText}>Anterior</Text>
            </ScalePress>
          ) : null}
          <ScalePress
            style={[styles.primaryButton, styles.primaryButtonFlex, !canContinue && styles.primaryButtonDisabled]}
            onPress={handleContinue}
            disabled={!canContinue}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canContinue }}
            accessibilityHint={canContinue ? undefined : 'Elige una opción para continuar'}
          >
            <Text style={[styles.primaryButtonText, !canContinue && styles.primaryButtonTextDisabled]}>
              {isLastStep ? 'Finalizar' : 'Siguiente'}
            </Text>
          </ScalePress>
        </View>
      </ScrollView>
    </>
  );
}
