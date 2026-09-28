import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BottomNav } from '@/shared/components/BottomNav';
import { styles } from '@/shared/styles/daily-test.styles';
import { InstrumentResult } from '../components/InstrumentResult';
import { TestOffer } from '../components/TestOffer';
import { TestRunner } from '../components/TestRunner';
import { gad7 } from '../data/gad7';
import { phq9 } from '../data/phq9';
import { sondeoInicial, type SondeoResult } from '../data/sondeoInicial';
import type { Instrument, TestQuestion, TestResult } from '../data/types';
import { who5 } from '../data/who5';
import { fetchStressTestInstrument } from '../infrastructure/stressTestRepository';
import {
  isPhq9Item9Positive,
  needsModerateReferral,
  shouldOfferGad7,
  shouldOfferPhq9,
  shouldOfferSondeo,
} from '../routingRules';

type Step =
  | { name: 'instrument'; instrument: Instrument }
  | { name: 'offer'; target: 'phq9' | 'gad7' | 'sondeo'; result?: TestResult }
  | {
      name: 'result';
      instrument: Instrument;
      result: TestResult;
      next: 'offer-gad7' | 'done';
    }
  | { name: 'done' };

const REFERRAL_TITLE = 'Te sugerimos pedir apoyo';
const REFERRAL_DESCRIPTION =
  'Tu resultado indica que podría ser bueno conversar con un profesional del área de bienestar estudiantil.';

export default function DailyCheckinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mood?: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pss10Instrument, setPss10Instrument] = useState<Instrument | null>(null);
  const [pendingGad7, setPendingGad7] = useState(false);
  const [step, setStep] = useState<Step>(() =>
    shouldOfferSondeo(String(params.mood ?? ''))
      ? { name: 'instrument', instrument: sondeoInicial }
      : { name: 'instrument', instrument: who5 },
  );

  const loadTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const inst = await fetchStressTestInstrument();
      setPss10Instrument(inst);
      if (!shouldOfferSondeo(String(params.mood ?? ''))) {
        setStep({ name: 'instrument', instrument: inst });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido al cargar el test';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTest();
  }, []);

  const handlePss10Complete = (answers: Record<number, number>) => {
    if (!pss10Instrument) return;
    const result = pss10Instrument.score(answers);
    const isHighStress =
      ['alto', 'muy_alto', 'muy alto', 'severo', 'alta'].includes(String(result.category).toLowerCase()) ||
      result.score >= Math.round(result.maxScore * 0.7);

    if (isHighStress) {
      router.replace('/views/tests/crisis-resources');
      return;
    }

    setStep({ name: 'done' });
  };

  const handleWho5Complete = (answers: Record<number, number>) => {
    const result = who5.score(answers);
    if (result.category === 'bajo') {
      setStep({ name: 'offer', target: 'sondeo', result });
      return;
    }
    setStep({ name: 'result', instrument: who5, result, next: 'done' });
  };

  const handleSondeoComplete = (answers: Record<number, number>) => {
    const result = sondeoInicial.score(answers) as SondeoResult;
    const offerPhq9 = shouldOfferPhq9(result.depressionScore);
    const offerGad7 = shouldOfferGad7(result.anxietyScore);

    if (offerPhq9) {
      setPendingGad7(offerGad7);
      setStep({ name: 'offer', target: 'phq9' });
      return;
    }
    if (offerGad7) {
      setStep({ name: 'offer', target: 'gad7' });
      return;
    }
    setStep({ name: 'result', instrument: sondeoInicial, result, next: 'done' });
  };

  const handleAnswer = (questionId: number, value: number, question?: TestQuestion) => {
    if (question?.isCritica && value > 0) {
      router.replace('/views/tests/crisis-resources');
      return;
    }
    if (step.name === 'instrument' && step.instrument.id === 'phq9' && isPhq9Item9Positive(questionId, value)) {
      router.replace('/views/tests/crisis-resources');
    }
  };

  const handlePhq9Complete = (answers: Record<number, number>) => {
    const result = phq9.score(answers);
    setStep({ name: 'result', instrument: phq9, result, next: pendingGad7 ? 'offer-gad7' : 'done' });
  };

  const handleGad7Complete = (answers: Record<number, number>) => {
    const result = gad7.score(answers);
    setStep({ name: 'result', instrument: gad7, result, next: 'done' });
  };

  const completionHandlers: Record<string, (answers: Record<number, number>) => void> = {
    pss10: handlePss10Complete,
    who5: handleWho5Complete,
    sondeo: handleSondeoComplete,
    phq9: handlePhq9Complete,
    gad7: handleGad7Complete,
  };

  const handleResultFinish = () => {
    if (step.name !== 'result') return;
    if (step.next === 'offer-gad7') {
      setPendingGad7(false);
      setStep({ name: 'offer', target: 'gad7' });
      return;
    }
    setStep({ name: 'done' });
  };

  const renderOffer = (target: 'phq9' | 'gad7' | 'sondeo', result?: TestResult) => {
    if (target === 'sondeo') {
      return (
        <TestOffer
          title="Lamentamos oír esto"
          subtitle="Seguimiento de tu bienestar"
          description="Nos gustaría ayudarte, pero debes responder un par de preguntas más para esto. Toma menos de 2 minutos."
          primaryLabel="Continuar"
          onPrimary={() => setStep({ name: 'instrument', instrument: sondeoInicial })}
          secondaryLabel="Por ahora no"
          onSecondary={() => setStep({ name: 'done' })}
          result={result ?? null}
        />
      );
    }

    const targetInstrument = target === 'phq9' ? phq9 : gad7;
    const isDepression = target === 'phq9';
    return (
      <TestOffer
        title={isDepression ? 'Recomendamos una evaluación más completa' : 'Evaluación de ansiedad sugerida'}
        subtitle="Recomendación basada en tus respuestas"
        description={
          isDepression
            ? 'Tus respuestas sugieren revisar tu ánimo con el cuestionario PHQ-9. Es voluntario y toma unos 3 minutos.'
            : 'Tus respuestas sugieren revisar tu nivel de ansiedad con el cuestionario GAD-7. Es voluntario y toma unos 3 minutos.'
        }
        primaryLabel={`Comenzar ${targetInstrument.eyebrow}`}
        onPrimary={() => setStep({ name: 'instrument', instrument: targetInstrument })}
        secondaryLabel="Ahora no"
        onSecondary={() => {
          if (isDepression && pendingGad7) {
            setStep({ name: 'offer', target: 'gad7' });
            return;
          }
          setStep({ name: 'done' });
        }}
      />
    );
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

  if (error) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.container}>
          <View style={[styles.panel, { alignItems: 'center', paddingVertical: 32 }]}>
            <Text style={[styles.questionText, { textAlign: 'center', marginBottom: 8 }]}>
              No pudimos cargar el test
            </Text>
            <Text style={[styles.helperText, { textAlign: 'center', marginBottom: 20 }]}>
              {error}
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

  const renderStep = () => {
    if (step.name === 'instrument') {
      const { instrument } = step;
      return (
        <TestRunner
          key={instrument.id}
          eyebrow={instrument.eyebrow}
          subtitle={instrument.name}
          questions={instrument.questions}
          options={instrument.options}
          onAnswer={handleAnswer}
          onComplete={completionHandlers[instrument.id]}
        />
      );
    }

    if (step.name === 'offer') {
      return renderOffer(step.target, step.result);
    }

    if (step.name === 'result') {
      const { result, instrument } = step;
      const referral = needsModerateReferral(result)
        ? {
            title: REFERRAL_TITLE,
            description: REFERRAL_DESCRIPTION,
            label: 'Ir a Bienestar',
            onPress: () => router.push('/views/wellness'),
          }
        : null;

      return (
        <InstrumentResult
          subtitle={instrument.name}
          eyebrow={instrument.eyebrow}
          result={result}
          description={instrument.interpretation[result.category]}
          referral={referral}
          onFinish={handleResultFinish}
          finishLabel="Finalizar"
        />
      );
    }

    return (
      <TestOffer
        title="Gracias por responder"
        subtitle="Registro de hoy"
        description="Tomarte un momento para revisar cómo estás es un buen paso. Tu respuesta quedó registrada."
        primaryLabel="Volver"
        onPrimary={() => router.back()}
      />
    );
  };

  return (
    <View style={styles.safeArea}>
      {renderStep()}
      <BottomNav currentTab="checkin" />
    </View>
  );
}
