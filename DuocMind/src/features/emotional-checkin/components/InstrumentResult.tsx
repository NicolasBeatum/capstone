import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from '@/shared/styles/daily-test.styles';
import type { TestResult } from '../data/types';

interface ResultAction {
  label: string;
  onPress: () => void;
}

interface ReferralAction extends ResultAction {
  title: string;
  description: string;
}

interface InstrumentResultProps {
  /** Nombre del instrumento mostrado en el subtítulo del header */
  subtitle: string;
  /** Etiqueta superior de la tarjeta, ej. 'TEST DE ÁNIMO (PHQ-9)' */
  eyebrow: string;
  result: TestResult;
  description?: string;
  /** Derivación a bienestar estudiantil (rango moderado o superior) */
  referral?: ReferralAction | null;
  /** Acción secundaria opcional, ej. ofrecer el sondeo tras WHO-5 bajo */
  secondaryAction?: ResultAction | null;
  onFinish: () => void;
  finishLabel?: string;
}

export function InstrumentResult({
  subtitle,
  eyebrow,
  result,
  description,
  referral,
  secondaryAction,
  onFinish,
  finishLabel = 'Finalizar',
}: InstrumentResultProps) {
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
            <Text style={styles.resultEyebrow}>{eyebrow}</Text>
            <View style={styles.badgeChip}>
              <Text style={styles.badgeChipText}>RESULTADO</Text>
            </View>
          </View>

          <Text style={styles.resultTitle}>{result.categoryLabel}</Text>

          <View style={styles.resultPercentBox}>
            <Text style={styles.resultPercent}>{result.score}</Text>
            <Text style={styles.resultPercentLabel}>puntaje de {result.maxScore}</Text>
            {result.percentage !== undefined ? (
              <Text style={styles.resultPercentLabel}>{result.percentage}% de bienestar</Text>
            ) : null}
          </View>

          {description ? <Text style={styles.resultMessage}>{description}</Text> : null}

          {referral ? (
            <View style={styles.referralCard}>
              <Text style={styles.referralTitle}>{referral.title}</Text>
              <Text style={styles.referralText}>{referral.description}</Text>
              <TouchableOpacity style={styles.referralButton} onPress={referral.onPress} activeOpacity={0.85}>
                <Text style={styles.referralButtonText}>{referral.label} →</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.resultButtonsRow}>
            <TouchableOpacity style={styles.acceptButton} onPress={onFinish} activeOpacity={0.85}>
              <Text style={styles.acceptButtonText}>{finishLabel}</Text>
            </TouchableOpacity>

            {secondaryAction ? (
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={secondaryAction.onPress}
                activeOpacity={0.85}
              >
                <Text style={styles.rejectButtonText}>{secondaryAction.label}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
