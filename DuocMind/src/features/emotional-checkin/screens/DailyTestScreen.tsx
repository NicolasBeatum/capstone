import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomNav } from '@/shared/components/BottomNav';
import { LiquidBackground } from '@/shared/components/Glass';
import { GotaLoader } from '@/shared/components/GotaLoader';
import { ScalePress } from '@/shared/components/ScalePress';
import { consentOwnerGateway } from '@/shared/consents/infrastructure/consentOwnerGateway';
import { canUploadEmotionalDataNow } from '@/shared/consents/infrastructure/emotionalUploadPolicy';
import { lastStressTestStore } from '../infrastructure/lastStressTestStorage';
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
  // Sin consentimientos activos el resultado no se envía; el test no tiene almacenamiento local.
  const [notSaved, setNotSaved] = useState(false);

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

  /** La fecha y el nivel se guardan siempre en el dispositivo para el aviso de 30 días. */
  const rememberLocally = async (result: TestResult) => {
    try {
      const ownerId = await consentOwnerGateway.currentOwner();
      if (ownerId) {
        await lastStressTestStore.write(ownerId, {
          appliedAt: new Date().toISOString(),
          level: String(result.category),
        });
      }
    } catch {
      // Solo se pierde el aviso; el test ya terminó.
    }
  };

  const saveApplication = async (answers: Record<number, number>, result: TestResult) => {
    await rememberLocally(result);
    if (!instrument?.testId || !instrument.testVersion) {
      setSaveError('No se pudo identificar la versión del test.');
      return;
    }
    if (!(await canUploadEmotionalDataNow())) {
      setNotSaved(true);
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
        <LiquidBackground />
        <View style={styles.stateBox}>
          <GotaLoader text="Preparando tu test…" />
        </View>
        <BottomNav currentTab="checkin" />
      </View>
    );
  }

  if (error || !instrument) {
    return (
      <View style={styles.safeArea}>
        <LiquidBackground />
        <View style={styles.stateBox}>
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>No pudimos cargar el test</Text>
            <Text style={styles.resultMessage}>{error ?? 'No se encontró el test.'}</Text>
            <ScalePress style={[styles.primaryButton, styles.primaryButtonBlock]} onPress={loadTest} accessibilityRole="button">
              <Text style={styles.primaryButtonText}>Reintentar</Text>
            </ScalePress>
          </View>
        </View>
        <BottomNav currentTab="checkin" />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <LiquidBackground />
      {finished ? (
        <TestOffer
          title="Gracias por responder"
          subtitle={instrument.name}
          description={
            saveError
              ? `No pudimos guardar tu resultado: ${saveError}`
              : notSaved
                ? 'Tu resultado no se guardó, porque no tienes consentimientos activos. Tomarte un momento para revisar cómo estás es un buen paso.'
                : 'Tomarte un momento para revisar cómo estás es un buen paso. Puedes volver cuando quieras.'
          }
          primaryLabel="Volver"
          onPrimary={() => router.back()}
        />
      ) : (
        <TestRunner
          key={instrument.id}
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
