import { StyleSheet } from 'react-native';

import { fontFamily as font } from '@/shared/theme/typography';

/* ── Paleta cálida compartida con el dashboard ── */
const cream = '#f3ecda';
const navy = '#1a2b44';
const yellow = '#f2c14e';
const textSecondary = '#8a8272';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: cream,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
  },
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    color: navy,
    textAlign: 'center',
    fontFamily: font.extraBold,
  },
  subtitle: {
    fontSize: 14,
    color: textSecondary,
    marginTop: 6,
    textAlign: 'center',
    fontFamily: font.semiBold,
  },

  /* ── Carita: ocupa el espacio libre del centro ── */
  faceArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodLabel: {
    fontSize: 22,
    color: navy,
    marginTop: 18,
    fontFamily: font.extraBold,
  },

  sliderArea: {
    marginBottom: 26,
  },

  /* ── Botón registrar: minimalista, pastilla oscura ── */
  registerButton: {
    alignSelf: 'center',
    minWidth: 200,
    height: 54,
    paddingHorizontal: 40,
    borderRadius: 27,
    backgroundColor: navy,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  registerButtonSaved: {
    backgroundColor: yellow,
  },
  registerText: {
    color: '#ffffff',
    fontSize: 16,
    letterSpacing: 0.4,
    fontFamily: font.extraBold,
  },
  registerTextSaved: {
    color: navy,
  },
  feedback: {
    minHeight: 34,
    marginTop: 10,
    fontSize: 12,
    lineHeight: 17,
    color: textSecondary,
    textAlign: 'center',
    fontFamily: font.semiBold,
  },
  feedbackError: {
    color: '#9b3d33',
  },
});
