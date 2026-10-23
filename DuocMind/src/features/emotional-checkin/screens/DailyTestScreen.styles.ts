import { StyleSheet } from 'react-native';

import { glassTokens } from '@/shared/components/Glass';
import { fontFamily as font } from '@/shared/theme/typography';

const cream = '#f3ecda';
const navy = '#1a2b44';
const textSecondary = '#8a8272';
/* Salvia: la misma familia del gráfico semanal y de la gota de carga. */
const sage = '#468a6c';
const sageDeep = '#2b6b50';
const sageWash = '#e3efe6';
const surface = 'rgba(255, 253, 247, 0.92)';

/* ── Test: una pregunta por pantalla, directamente sobre el fondo, sin panel que la encierre ── */
export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 15,
    color: navy,
    fontFamily: font.extraBold,
  },
  headerDetail: {
    fontSize: 13,
    color: textSecondary,
    marginTop: 1,
    fontFamily: font.semiBold,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: glassTokens.surfaceStrong,
    borderWidth: 1,
    borderColor: glassTokens.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 110,
  },
  stateBox: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 26,
  },
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(138, 130, 114, 0.2)',
  },
  progressSegmentDone: {
    backgroundColor: sage,
  },
  progressSegmentCurrent: {
    backgroundColor: navy,
  },
  questionText: {
    fontSize: 23,
    lineHeight: 30,
    color: navy,
    fontFamily: font.extraBold,
  },
  helperText: {
    fontSize: 14,
    lineHeight: 20,
    color: textSecondary,
    marginTop: 8,
    fontFamily: font.regular,
  },
  optionsList: {
    gap: 10,
    marginTop: 24,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    backgroundColor: surface,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    paddingHorizontal: 16,
    ...glassTokens.shadow,
    shadowOpacity: 0.06,
    elevation: 2,
  },
  optionButtonSelected: {
    backgroundColor: sageWash,
    borderColor: sage,
  },
  /* Ancho fijo: los textos quedan alineados aunque el punto cambie de tamaño. */
  optionDotSlot: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  optionDot: {
    backgroundColor: 'rgba(70, 138, 108, 0.32)',
  },
  optionDotSelected: {
    backgroundColor: sage,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: navy,
    fontFamily: font.semiBold,
  },
  optionTextSelected: {
    color: sageDeep,
    fontFamily: font.extraBold,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 26,
  },
  primaryButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: navy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  primaryButtonFlex: {
    flex: 1,
  },
  primaryButtonBlock: {
    alignSelf: 'stretch',
  },
  primaryButtonDisabled: {
    backgroundColor: 'rgba(26, 43, 68, 0.12)',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: font.extraBold,
  },
  primaryButtonTextDisabled: {
    color: 'rgba(26, 43, 68, 0.45)',
  },
  backButton: {
    minHeight: 52,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: navy,
    fontSize: 15,
    fontFamily: font.bold,
  },
  /* ── Cierre y error ── */
  resultCard: {
    backgroundColor: surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: glassTokens.border,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    ...glassTokens.shadow,
  },
  resultMark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: sageWash,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 22,
    lineHeight: 28,
    color: navy,
    textAlign: 'center',
    fontFamily: font.extraBold,
    marginBottom: 8,
  },
  resultMessage: {
    fontSize: 14,
    lineHeight: 21,
    color: textSecondary,
    textAlign: 'center',
    fontFamily: font.regular,
    marginBottom: 22,
  },
});
