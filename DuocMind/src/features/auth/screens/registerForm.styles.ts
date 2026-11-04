import { StyleSheet } from 'react-native';

import { fontFamily as font } from '@/shared/theme/typography';
import { warmPalette as palette } from '@/shared/theme/warmPalette';

/** Estilos de «Crear cuenta» y de los componentes que solo usa el registro. */
export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  /* ── Encabezado ── */
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 28,
    fontSize: 32,
    lineHeight: 38,
    color: palette.navy,
    fontFamily: font.extraBold,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 22,
    fontSize: 15,
    lineHeight: 21,
    color: palette.textSecondary,
    fontFamily: font.regular,
  },

  /* ── Tarjetas numeradas ── */
  card: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#6B5A33',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  sectionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: {
    color: palette.white,
    fontSize: 15,
    fontFamily: font.extraBold,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 21,
    lineHeight: 27,
    color: palette.navy,
    fontFamily: font.extraBold,
  },

  /* ── Campos ── */
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: palette.navy,
    marginBottom: 8,
    fontFamily: font.bold,
  },
  inputContainer: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: palette.inputBorder,
    paddingHorizontal: 14,
    gap: 12,
  },
  inputError: {
    borderColor: palette.error,
  },
  input: {
    flex: 1,
    minHeight: 52,
    fontSize: 16,
    color: palette.navy,
    fontFamily: font.semiBold,
  },
  eyeButton: {
    width: 44,
    height: 44,
    marginRight: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldError: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: palette.error,
    fontFamily: font.semiBold,
  },

  /* ── Seguridad de la contraseña ── */
  strength: {
    marginBottom: 18,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthLabel: {
    fontSize: 13,
    color: palette.textSecondary,
    fontFamily: font.bold,
  },
  strengthStatus: {
    fontSize: 13,
    fontFamily: font.extraBold,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  strengthBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E6DCC8',
  },
  requirements: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
  },
  requirement: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 6,
  },
  requirementDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: palette.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requirementDotMet: {
    backgroundColor: palette.success,
    borderColor: palette.success,
  },
  requirementText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17,
    color: palette.textSecondary,
    fontFamily: font.regular,
  },
  requirementTextMet: {
    color: palette.navy,
    fontFamily: font.semiBold,
  },

  /* ── Carga y error del catálogo ── */
  catalogError: {
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
    color: palette.error,
    fontFamily: font.semiBold,
  },
  retryButton: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  retryText: {
    fontSize: 14,
    color: palette.navy,
    textDecorationLine: 'underline',
    fontFamily: font.bold,
  },

  /* ── Privacidad y consentimientos ── */
  termsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    padding: 12,
    backgroundColor: palette.goldSoft,
    borderWidth: 1.5,
    borderColor: palette.gold,
    borderRadius: 18,
  },
  termsLinkIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsLinkBody: {
    flex: 1,
  },
  termsLinkTitle: {
    fontSize: 15,
    lineHeight: 20,
    color: palette.navy,
    textDecorationLine: 'underline',
    fontFamily: font.extraBold,
  },
  termsLinkScope: {
    marginTop: 2,
    fontSize: 13,
    color: palette.textSecondary,
    fontFamily: font.semiBold,
  },
  consentGroup: {
    marginLeft: 8,
    paddingLeft: 18,
    paddingTop: 6,
    borderLeftWidth: 4,
    borderLeftColor: palette.gold,
  },
  consent: {
    minHeight: 44,
    paddingVertical: 10,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 8,
  },
  tagRequired: {
    backgroundColor: palette.navy,
  },
  tagOptional: {
    backgroundColor: '#E9E3D4',
  },
  tagText: {
    fontSize: 12,
    fontFamily: font.bold,
  },
  tagTextRequired: {
    color: palette.white,
  },
  tagTextOptional: {
    color: palette.textSecondary,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: palette.inputBorder,
    backgroundColor: palette.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: palette.navy,
    borderColor: palette.navy,
  },
  consentText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    color: palette.navy,
    fontFamily: font.semiBold,
  },

  /* ── Acciones ── */
  primaryButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor: palette.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: palette.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryButtonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: palette.white,
    fontSize: 17,
    marginRight: 10,
    fontFamily: font.extraBold,
  },
  buttonArrow: {
    color: palette.gold,
    fontSize: 20,
    fontFamily: font.bold,
  },
  blockerHint: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: palette.textSecondary,
    fontFamily: font.semiBold,
  },
  feedbackError: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: palette.error,
    fontFamily: font.semiBold,
  },
  feedbackSuccess: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 20,
    color: '#1F6B52',
    fontFamily: font.semiBold,
  },
  confirmationLoginButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confirmationLoginText: {
    color: palette.navy,
    fontSize: 14,
    textDecorationLine: 'underline',
    fontFamily: font.bold,
  },

  /* ── Pie ── */
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  footerText: {
    fontSize: 15,
    color: palette.textSecondary,
    fontFamily: font.regular,
  },
  footerLinkButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  footerLink: {
    fontSize: 15,
    color: palette.navy,
    textDecorationLine: 'underline',
    fontFamily: font.extraBold,
  },
});
