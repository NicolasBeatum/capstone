import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomNav } from '@/shared/components/BottomNav';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { styles } from './DailyTestScreen.styles';
import { TestOffer } from '../components/TestOffer';
import { TestRunner } from '../components/TestRunner';
import type { Instrument, TestQuestion, TestResult } from '../domain/types';
import {
  fetchStressTestInstrument,
  saveStressTestApplication,
} from '../infrastructure/stressTestRepository';

/** Resultados de estrés alto que derivan a recursos de crisis sin mostrar resultado. */
const HIGH_STRESS_CATEGORIES = ['alto', 'muy_alto', 'muy alto', 'severo', 'alta'];

export default function DailyTestScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadTest = async () => {
    setLoading(true);
    setError(null);
    try {
      setInstrument(await fetchStressTestInstrument());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido al cargar el test';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTest();
  }, []);

  const saveApplication = async (answers: Record<number, number>, result: TestResult) => {
    if (!instrument?.testId || !instrument.testVersion) {
      setSaveError('No se pudo identificar la versión del test.');
      return;
    }
    try {
      await saveStressTestApplication({
        testId: instrument.testId,
        testVersion: instrument.testVersion,
        result,
        criticalItemDetected: instrument.questions.some(
          (question) => question.isCritica && (answers[question.id] ?? 0) > 0,
        ),
      });
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error desconocido al guardar el test');
    }
  };

  const handleComplete = async (answers: Record<number, number>) => {
    if (!instrument || saving) return;
    const result = instrument.score(answers);
    const isHighStress =
      HIGH_STRESS_CATEGORIES.includes(String(result.category).toLowerCase()) ||
      result.score >= Math.round(result.maxScore * 0.7);

    setSaving(true);
    await saveApplication(answers, result);
    setSaving(false);

    // La derivación a recursos de crisis no depende de que el guardado haya funcionado.
    if (isHighStress) {
      router.replace('/wellness/crisis-resources');
      return;
    }

    setFinished(true);
  };

  const handleAnswer = (_questionId: number, value: number, question?: TestQuestion) => {
    if (question?.isCritica && value > 0) {
      router.replace('/wellness/crisis-resources');
    }
  };

  if (loading) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.container}>
          <View style={[styles.panel, { alignItems: 'center', paddingVertical: 40 }]}>
            <GotaLoader style={{ marginBottom: 16 }} />
            <Text style={styles.questionText}>Cargando Test Estrés Percibido...</Text>
            <Text style={styles.helperText}>Obteniendo preguntas desde Supabase</Text>
          </View>
        </View>
        <BottomNav currentTab="checkin" />
      </View>
    );
  }

  if (error || !instrument) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.container}>
          <View style={[styles.panel, { alignItems: 'center', paddingVertical: 32 }]}>
            <Text style={[styles.questionText, { textAlign: 'center', marginBottom: 8 }]}>
              No pudimos cargar el test
            </Text>
            <Text style={[styles.helperText, { textAlign: 'center', marginBottom: 20 }]}>
              {error ?? 'No se encontró el test.'}
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={loadTest} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        </View>
        <BottomNav currentTab="checkin" />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      {finished ? (
        <TestOffer
          title="Gracias por responder"
          subtitle="Registro de hoy"
          description={
            saveError
              ? `No pudimos guardar tu resultado: ${saveError}`
              : 'Tomarte un momento para revisar cómo estás es un buen paso. Puedes volver cuando quieras.'
          }
          primaryLabel="Volver"
          onPrimary={() => router.back()}
        />
      ) : (
        <TestRunner
          key={instrument.id}
          eyebrow={instrument.eyebrow}
          subtitle={instrument.name}
          questions={instrument.questions}
          options={instrument.options}
          onAnswer={handleAnswer}
          onComplete={handleComplete}
        />
      )}
      <BottomNav currentTab="checkin" />
    </View>
  );
}
