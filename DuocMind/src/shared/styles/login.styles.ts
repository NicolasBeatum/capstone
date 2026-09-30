import { StyleSheet } from 'react-native';

import { glassTokens } from '@/shared/components/glass';
import { fontFamily as font } from '@/shared/typography';

/* ── Paleta cálida compartida con el resto de la app ── */
const cream = '#f3ecda';
const navy = '#1a2b44';
const yellowSoft = '#f9dd85';
const textSecondary = '#8a8272';
const textMuted = '#b0a891';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: cream,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 48,
    paddingBottom: 40,
  },
  /* ── Bienvenida ── */
  hero: {
    alignItems: 'center',
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
  /* ── Formulario (GlassCard aporta fondo, borde y sombra) ── */
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
    borderRadius: 16,
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
  },
  feedbackSuccess: {
    color: '#256b4a',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 12,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: glassTokens.border,
  },
  dividerText: {
    fontSize: 10,
    color: textMuted,
    marginHorizontal: 10,
    fontFamily: font.bold,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glassTokens.surfaceStrong,
    borderWidth: 1,
    borderColor: glassTokens.border,
    borderRadius: 16,
    height: 46,
    marginBottom: 10,
    gap: 8,
  },
  socialIcon: {
    fontSize: 14,
    color: '#4285F4',
    fontFamily: font.extraBold,
  },
  secondaryButtonText: {
    fontSize: 12,
    color: textSecondary,
    fontFamily: font.bold,
  },
  ssoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(249, 221, 133, 0.35)',
    borderWidth: 1,
    borderColor: glassTokens.border,
    borderRadius: 16,
    height: 46,
    gap: 8,
  },
  ssoButtonText: {
    fontSize: 12,
    color: navy,
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
  registerLink: {
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
