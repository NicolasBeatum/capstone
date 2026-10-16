import { StyleSheet } from 'react-native';

import { fontFamily as font } from '@/shared/theme/typography';

/* Complementa authForm.styles con lo propio del perfil; la paleta es la misma. */
const navy = '#1a2b44';
const textSecondary = '#8a8272';
const gold = '#d4b43c';
const success = '#4f8a62';

export const profileStyles = StyleSheet.create({
  hero: {
    marginTop: 12,
    marginBottom: 18,
  },
  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  stepBar: {
    width: 34,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(26, 43, 68, 0.12)',
  },
  stepBarDone: {
    backgroundColor: success,
  },
  stepBarActive: {
    backgroundColor: gold,
  },
  stepLabel: {
    marginLeft: 6,
    fontSize: 12,
    color: textSecondary,
    fontFamily: font.bold,
  },
  title: {
    fontSize: 26,
    color: navy,
    fontFamily: font.extraBold,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: textSecondary,
    marginTop: 6,
    fontFamily: font.regular,
  },
  credential: {
    marginBottom: 16,
  },
  inputFocused: {
    borderColor: gold,
    backgroundColor: '#ffffff',
  },
  inputDone: {
    borderColor: success,
  },
  doneBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 11,
    lineHeight: 15,
    color: textSecondary,
    marginTop: 6,
    fontFamily: font.regular,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 22,
    paddingHorizontal: 12,
  },
  noteText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: textSecondary,
    textAlign: 'center',
    fontFamily: font.regular,
  },
});
