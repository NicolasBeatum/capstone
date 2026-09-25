import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SparkleIcon } from '@/shared/components/icons';
import { styles } from '@/shared/styles/daily-test.styles';
import type { TestResult } from '../data/types';

interface TestOfferProps {
  /** Título de la tarjeta, ej. 'Recomendamos una evaluación más completa' */
  title: string;
  /** Subtítulo del header */
  subtitle: string;
  description: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Resultado previo a mostrar, ej. WHO-5 bajo antes de ofrecer el sondeo */
  result?: TestResult | null;
}

/**
 * Pantalla intermedia entre instrumentos: ofrece el test completo sugerido
 * por las reglas de ruteo, o cierra el flujo cuando no hay más pasos.
 */
export function TestOffer({
  title,
  subtitle,
  description,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  result,
}: TestOfferProps) {
  const router = useRouter();

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
        <View style={styles.resultCard}>
          <View style={styles.resultHeaderRow}>
            <Text style={styles.resultEyebrow}>CHECK-IN EMOCIONAL</Text>
            <View style={styles.questionIllustration}>
              <SparkleIcon size={12} />
              <SparkleIcon size={9} color="#e8a93c" />
            </View>
          </View>

          {result ? (
            <View style={styles.resultPercentBox}>
              <Text style={styles.resultPercent}>
                {result.percentage !== undefined ? `${result.percentage}%` : result.score}
              </Text>
              <Text style={styles.resultPercentLabel}>
                Tus resultados son: {result.percentage !== undefined ? `${result.percentage}% de bienestar` : `${result.score} puntos`}
              </Text>
              <Text style={styles.resultPercentLabel}>
                puntaje {result.score} de {result.maxScore}
              </Text>
            </View>
          ) : null}

          <Text style={styles.resultTitle}>{title}</Text>
          <Text style={styles.resultMessage}>{description}</Text>

          <View style={styles.resultButtonsRow}>
            <TouchableOpacity style={styles.acceptButton} onPress={onPrimary} activeOpacity={0.85}>
              <Text style={styles.acceptButtonText}>{primaryLabel} →</Text>
            </TouchableOpacity>

            {secondaryLabel ? (
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={onSecondary}
                activeOpacity={0.85}
                disabled={!onSecondary}
              >
                <Text style={styles.rejectButtonText}>{secondaryLabel}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
