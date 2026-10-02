import { StyleSheet } from 'react-native';

import { glassTokens } from '@/shared/components/Glass';
import { fontFamily as font } from '@/shared/theme/typography';

/* ── Paleta cálida compartida con el dashboard, con superficies liquid ── */
const cream = '#f3ecda';
const navy = '#1a2b44';
const yellowSoft = '#f9dd85';
const textSecondary = '#8a8272';

const HALO_SIZE = 250;

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: cream,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
    paddingBottom: 28,
  },
  /* ── Pregunta principal ── */
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 27,
    lineHeight: 33,
    color: navy,
    textAlign: 'center',
    fontFamily: font.extraBold,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: textSecondary,
    textAlign: 'center',
    fontFamily: font.regular,
  },
  /* ── Rostro central ── */
  faceStage: {
    alignItems: 'center',
    justifyContent: 'center',
    height: HALO_SIZE,
    marginBottom: 8,
  },
  halo: {
    position: 'absolute',
    width: HALO_SIZE,
    height: HALO_SIZE,
    borderRadius: HALO_SIZE / 2,
    opacity: 0.35,
  },
  moodLabel: {
    fontSize: 24,
    color: navy,
    textAlign: 'center',
    fontFamily: font.extraBold,
  },
  moodLabelWrap: {
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  /* ── Deslizador ── */
  sliderCard: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 22,
  },
  /* ── Confirmar ── */
  saveButton: {
    backgroundColor: navy,
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    ...glassTokens.shadow,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    marginRight: 6,
    fontFamily: font.bold,
  },
  saveButtonArrow: {
    color: yellowSoft,
    fontSize: 16,
    fontFamily: font.bold,
  },
  savedMessage: {
    marginTop: 16,
    alignItems: 'center',
  },
  savedText: {
    fontSize: 14,
    color: navy,
    textAlign: 'center',
    fontFamily: font.bold,
  },
  savedHint: {
    marginTop: 2,
    fontSize: 12,
    color: textSecondary,
    textAlign: 'center',
    fontFamily: font.regular,
  },
  checkinFeedbackError: {
    color: '#9b3d33',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 14,
    textAlign: 'center',
  },
});
