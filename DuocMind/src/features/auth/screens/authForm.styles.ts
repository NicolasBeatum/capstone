import { StyleSheet } from 'react-native';

import { glassTokens } from '@/shared/components/Glass';
import { fontFamily as font } from '@/shared/theme/typography';

/* ── Paleta cálida compartida por login, registro y perfil (misma línea que el dashboard) ── */
const cream = '#f3ecda';
const navy = '#1a2b44';
const yellowSoft = '#f9dd85';
const textSecondary = '#8a8272';
const textMuted = '#b0a891';
const success = '#4f8a62';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: cream,
  },
  flex: {
    flex: 1,
  },
  // Cubre el formulario mientras se valida la sesión para que no se pueda reenviar.
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 50,
    elevation: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cream,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  /* ── Barra superior (registro y perfil) ── */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: glassTokens.surfaceStrong,
    borderWidth: 1,
    borderColor: glassTokens.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...glassTokens.shadow,
  },
  backArrow: {
    fontSize: 16,
    color: navy,
    fontFamily: font.bold,
  },
  topBarTitle: {
    fontSize: 11,
    letterSpacing: 0.8,
    color: textSecondary,
    fontFamily: font.bold,
  },
  topBarSpacer: {
    width: 42,
  },
  /* ── Bienvenida centrada (login) ── */
  hero: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 26,
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: glassTokens.surfaceStrong,
    borderWidth: 1,
    borderColor: glassTokens.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...glassTokens.shadow,
  },
  heroTitle: {
    fontSize: 26,
    color: navy,
    fontFamily: font.extraBold,
  },
  heroSubtitle: {
    fontSize: 13,
    color: textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
    fontFamily: font.regular,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glassTokens.surfaceStrong,
    borderWidth: 1,
    borderColor: glassTokens.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 14,
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d4b43c',
  },
  badgeText: {
    fontSize: 11,
    color: navy,
    fontFamily: font.semiBold,
  },
  /* ── Encabezado alineado a la izquierda (registro y perfil) ── */
  intro: {
    marginBottom: 16,
  },
  introEyebrow: {
    fontSize: 11,
    letterSpacing: 0.8,
    color: textSecondary,
    fontFamily: font.bold,
  },
  introTitle: {
    fontSize: 26,
    color: navy,
    marginTop: 2,
    fontFamily: font.extraBold,
  },
  introSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: textSecondary,
    marginTop: 6,
    fontFamily: font.regular,
  },
  /* ── Aviso destacado (misma caja amarilla del dashboard) ── */
  insightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fbebc4',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  insightIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  insightTextBox: {
    flex: 1,
  },
  insightText: {
    fontSize: 12,
    lineHeight: 18,
    color: navy,
    fontFamily: font.regular,
  },
  insightStrong: {
    fontFamily: font.extraBold,
  },
  /* ── Formulario (LiquidCard aporta fondo, borde y sombra) ── */
  formCard: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    color: navy,
    marginBottom: 6,
    fontFamily: font.bold,
  },
  forgotPasswordText: {
    fontSize: 11,
    color: '#c1912c',
    fontFamily: font.semiBold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glassTokens.surfaceStrong,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: glassTokens.border,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 13,
    color: navy,
    fontFamily: font.regular,
  },
  eyeButton: {
    padding: 4,
  },
  /* ── Fortaleza de la contraseña ── */
  strengthBox: {
    backgroundColor: 'rgba(249, 221, 133, 0.22)',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
  },
  strengthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  strengthLabel: {
    fontSize: 11,
    color: textSecondary,
    fontFamily: font.bold,
  },
  strengthStatus: {
    fontSize: 11,
    color: success,
    fontFamily: font.extraBold,
  },
  strengthBarBg: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(26, 43, 68, 0.10)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  strengthBarFill: {
    height: '100%',
    backgroundColor: success,
    borderRadius: 3,
  },
  reqGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 4,
  },
  reqIcon: {
    fontSize: 12,
    color: textMuted,
    marginRight: 5,
    fontFamily: font.bold,
  },
  reqPassed: {
    color: success,
  },
  reqText: {
    fontSize: 10,
    color: textSecondary,
    fontFamily: font.regular,
  },
  reqPassedText: {
    color: success,
    fontFamily: font.bold,
  },
  /* ── Términos ── */
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: navy,
    borderColor: navy,
  },
  checkboxCheck: {
    color: yellowSoft,
    fontSize: 12,
    fontFamily: font.extraBold,
  },
  termsText: {
    flex: 1,
    fontSize: 11,
    color: textSecondary,
    lineHeight: 16,
    fontFamily: font.regular,
  },
  /* ── Acciones ── */
  primaryButton: {
    backgroundColor: navy,
    borderRadius: 16,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    marginRight: 8,
    fontFamily: font.bold,
  },
  buttonArrow: {
    color: yellowSoft,
    fontSize: 16,
    fontFamily: font.bold,
  },
  feedbackError: {
    color: '#9b3d33',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 12,
    fontFamily: font.regular,
  },
  feedbackSuccess: {
    color: '#256b4a',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 12,
    fontFamily: font.regular,
  },
  confirmationLoginButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confirmationLoginText: {
    color: navy,
    fontSize: 12,
    textDecorationLine: 'underline',
    fontFamily: font.bold,
  },
  /* ── Pie ── */
  footerContainer: {
    alignItems: 'center',
    marginTop: 26,
  },
  footerText: {
    fontSize: 12,
    color: textSecondary,
    fontFamily: font.regular,
  },
  footerLink: {
    color: navy,
    textDecorationLine: 'underline',
    fontFamily: font.bold,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 6,
  },
  securityText: {
    fontSize: 10,
    color: textMuted,
    fontFamily: font.regular,
  },
});
