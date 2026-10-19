import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ScalePress } from '@/shared/components/ScalePress';
import { SparkleIcon } from '@/shared/components/Icons';
import { styles } from '../screens/DailyTestScreen.styles';

interface TestOfferProps {
  /** Título de la tarjeta, ej. 'Gracias por responder' */
  title: string;
  /** Subtítulo del header */
  subtitle: string;
  description: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

/**
 * Tarjeta de cierre del flujo del test, con acción principal y secundaria opcional.
 */
export function TestOffer({
  title,
  subtitle,
  description,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
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

          <Text style={styles.resultTitle}>{title}</Text>
          <Text style={styles.resultMessage}>{description}</Text>

          <View style={styles.resultButtonsRow}>
            <ScalePress style={styles.acceptButton} onPress={onPrimary}>
              <Text style={styles.acceptButtonText}>{primaryLabel} →</Text>
            </ScalePress>

            {secondaryLabel ? (
              <ScalePress
                style={styles.rejectButton}
                onPress={onSecondary}
                disabled={!onSecondary}
              >
                <Text style={styles.rejectButtonText}>{secondaryLabel}</Text>
              </ScalePress>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
