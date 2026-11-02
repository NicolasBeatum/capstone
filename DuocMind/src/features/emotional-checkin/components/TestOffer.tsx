import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { CheckIcon } from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import { styles } from '../screens/DailyTestScreen.styles';
import { TestHeader } from './TestHeader';

interface TestOfferProps {
  /** Título de la tarjeta, ej. 'Gracias por responder' */
  title: string;
  /** Nombre del instrumento, mostrado en el encabezado */
  subtitle: string;
  description: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

/**
 * Cierre del flujo del test, con acción principal y secundaria opcional.
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
  return (
    <>
      <TestHeader title={subtitle} detail="Test terminado" />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.resultCard}>
          <View style={styles.resultMark}>
            <CheckIcon size={28} color="#2b6b50" />
          </View>
          <Text style={styles.resultTitle} accessibilityLiveRegion="polite">{title}</Text>
          <Text style={styles.resultMessage}>{description}</Text>

          <ScalePress style={[styles.primaryButton, styles.primaryButtonBlock]} onPress={onPrimary} accessibilityRole="button">
            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
          </ScalePress>

          {secondaryLabel ? (
            <ScalePress
              style={styles.backButton}
              onPress={onSecondary}
              disabled={!onSecondary}
              accessibilityRole="button"
            >
              <Text style={styles.backButtonText}>{secondaryLabel}</Text>
            </ScalePress>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}
