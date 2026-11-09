import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { glassTokens } from '@/shared/components/Glass';
import { ScalePress } from '@/shared/components/ScalePress';
import { Reveal } from '@/shared/motion/Reveal';
import { fontFamily as font } from '@/shared/theme/typography';
import type { CheckinReason } from '../domain/checkinReasons';

interface ReasonBubblesProps {
  reasons: readonly CheckinReason[];
  selectedIds: readonly number[];
  onToggle: (id: number) => void;
}

const NAVY = '#1a2b44';
const MUTED = '#8a8272';

/**
 * Burbujas de vidrio con los motivos, bajo el Brote. Hay que elegir al menos una.
 * La elegida se eleva: vidrio más opaco, sombra marcada y letra más gruesa,
 * sin check ni cambio de color, para que la selección se lea por la profundidad.
 */
export function ReasonBubbles({ reasons, selectedIds, onToggle }: ReasonBubblesProps) {
  if (reasons.length === 0) return null;

  return (
    <View style={styles.container}>
      <Reveal>
        <Text style={styles.prompt}>¿Qué influye hoy? Elige al menos uno</Text>
      </Reveal>
      <View style={styles.bubbles}>
        {reasons.map((reason, index) => {
          const selected = selectedIds.includes(reason.id);
          return (
            <Reveal key={reason.id} index={index + 1}>
              <ScalePress
                style={[styles.bubble, selected && styles.bubbleSelected]}
                onPress={() => onToggle(reason.id)}
                accessibilityRole="button"
                accessibilityLabel={`Motivo ${reason.name}`}
                accessibilityHint={selected ? 'Toca para quitarlo' : 'Toca para agregarlo'}
                accessibilityState={{ selected }}
                // En web, accessibilityState no llega al DOM; aria-selected sirve en ambas.
                aria-selected={selected}
              >
                <View style={styles.sheen} pointerEvents="none" />
                <Text style={[styles.bubbleText, selected && styles.bubbleTextSelected]}>{reason.name}</Text>
              </ScalePress>
            </Reveal>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  prompt: {
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: font.bold,
  },
  bubbles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  bubble: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 999,
    justifyContent: 'center',
    backgroundColor: glassTokens.surface,
    borderWidth: 1,
    borderColor: glassTokens.border,
    // Casi plana: la sombra apenas la despega del fondo.
    shadowColor: glassTokens.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  bubbleSelected: {
    backgroundColor: glassTokens.surfaceStrong,
    // Elevada: la sombra profunda indica que el motivo está elegido.
    shadowColor: NAVY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: glassTokens.sheen,
  },
  bubbleText: {
    fontSize: 14,
    color: NAVY,
    fontFamily: font.semiBold,
  },
  bubbleTextSelected: {
    fontFamily: font.extraBold,
  },
});
