import React from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { glassTokens } from '@/shared/components/Glass';
import { ScalePress } from '@/shared/components/ScalePress';
import { fontFamily as font } from '@/shared/theme/typography';
import { warmPalette } from '@/shared/theme/warmPalette';

interface ConfirmDeletionModalProps {
  visible: boolean;
  title: string;
  /** Un párrafo por elemento. */
  paragraphs: string[];
  confirmLabel: string;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

/* backdropFilter solo existe en web; en Android el vidrio se simula con la superficie translúcida */
const webBlur = (amount: number): ViewStyle =>
  Platform.OS === 'web' ? ({ backdropFilter: `blur(${amount}px)` } as ViewStyle) : {};

/** Confirmación de una eliminación; funciona igual en Android y en la previsualización web. */
export function ConfirmDeletionModal({
  visible,
  title,
  paragraphs,
  confirmLabel,
  busy,
  error,
  onConfirm,
  onClose,
}: ConfirmDeletionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={busy ? undefined : onClose}>
      <Pressable
        style={[styles.backdrop, webBlur(10)]}
        onPress={busy ? undefined : onClose}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sin eliminar"
      />
      <View style={styles.center} pointerEvents="box-none">
        <View style={[styles.card, webBlur(24)]} accessibilityViewIsModal>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            {paragraphs.map((paragraph) => (
              <Text key={paragraph} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
            {error ? (
              <Text accessibilityLiveRegion="polite" style={styles.error}>
                {error}
              </Text>
            ) : null}
          </ScrollView>
          <ScalePress
            style={[styles.dangerButton, busy && styles.disabled]}
            onPress={onConfirm}
            disabled={busy}
            accessibilityRole="button"
            accessibilityState={{ busy, disabled: busy }}
          >
            <Text style={styles.dangerButtonText}>{busy ? 'Procesando…' : confirmLabel}</Text>
          </ScalePress>
          <ScalePress style={styles.secondaryButton} onPress={onClose} disabled={busy} accessibilityRole="button">
            <Text style={styles.secondaryButtonText}>Volver</Text>
          </ScalePress>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(26, 43, 68, 0.28)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '100%',
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 253, 247, 0.9)' : 'rgba(255, 253, 247, 0.98)',
    borderWidth: 1,
    borderColor: glassTokens.border,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 12,
    ...glassTokens.shadow,
  },
  content: {
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    color: warmPalette.navy,
    fontFamily: font.extraBold,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    color: warmPalette.navy,
    fontFamily: font.regular,
    marginTop: 6,
  },
  error: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
    color: warmPalette.error,
    fontFamily: font.semiBold,
  },
  dangerButton: {
    alignSelf: 'stretch',
    height: 50,
    borderRadius: 25,
    backgroundColor: warmPalette.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  dangerButtonText: {
    color: warmPalette.white,
    fontSize: 15,
    fontFamily: font.extraBold,
  },
  secondaryButton: {
    alignSelf: 'stretch',
    minHeight: 44,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: warmPalette.navy,
    fontSize: 14,
    fontFamily: font.bold,
  },
});
