import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomNav } from '@/shared/components/BottomNav';
import { styles } from './DailyTestScreen.styles';
import { TestOffer } from '../components/TestOffer';
import { TestRunner } from '../components/TestRunner';
import type { Instrument, TestQuestion } from '../domain/types';
import { fetchStressTestInstrument } from '../infrastructure/stressTestRepository';

/** Resultados de estrés alto que derivan a recursos de crisis sin mostrar resultado. */
const HIGH_STRESS_CATEGORIES = ['alto', 'muy_alto', 'muy alto', 'severo', 'alta'];

export default function DailyTestScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [finished, setFinished] = useState(false);

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

  const handleComplete = (answers: Record<number, number>) => {
    if (!instrument) return;
    const result = instrument.score(answers);
    const isHighStress =
      HIGH_STRESS_CATEGORIES.includes(String(result.category).toLowerCase()) ||
      result.score >= Math.round(result.maxScore * 0.7);

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
            <ActivityIndicator size="large" color="#1a2b44" style={{ marginBottom: 16 }} />
            <Text style={styles.questionText}>Cargando test de estrés...</Text>
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
          description="Tomarte un momento para revisar cómo estás es un buen paso. Puedes volver cuando quieras."
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
