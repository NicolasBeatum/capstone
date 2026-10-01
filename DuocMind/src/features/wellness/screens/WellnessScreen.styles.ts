import { StyleSheet } from 'react-native';

import { glassTokens } from '@/shared/components/Glass';
import { fontFamily as font } from '@/shared/theme/typography';

/* ── Paleta cálida alineada al diseño de referencia, coherente con el dashboard ── */
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
  scrollContent: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 28,
  },
  /* ── Header: saludo personalizado ── */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  headerText: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 23,
    color: navy,
    fontFamily: font.extraBold,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: textSecondary,
    marginTop: 2,
    fontFamily: font.regular,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  avatarInitials: {
    color: yellowSoft,
    fontSize: 14,
    fontFamily: font.extraBold,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: glassTokens.surfaceStrong,
    borderWidth: 1,
    borderColor: glassTokens.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    ...glassTokens.shadow,
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#f2c14e',
    borderWidth: 1.5,
    borderColor: cream,
  },
  /* ── Centro de bienestar (GlassCard aporta fondo, borde y sombra) ── */
  centerCard: {
    padding: 18,
    marginBottom: 22,
  },
  centerCardTitle: {
    fontSize: 18,
    color: navy,
    textAlign: 'center',
    fontFamily: font.extraBold,
  },
  centerCardSubtitle: {
    fontSize: 12,
    color: textSecondary,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 14,
    fontFamily: font.regular,
  },
  /* ── Afirmación del día (LiquidPanel aporta el gradiente) ── */
  affirmBanner: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    ...glassTokens.shadow,
  },
  affirmIconBox: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: glassTokens.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  affirmText: {
    flex: 1,
    fontSize: 12,
    color: navy,
    lineHeight: 17,
    fontFamily: font.regular,
  },
  affirmLabel: {
    fontFamily: font.extraBold,
  },
  /* ── Tarjeta del test emocional (LiquidPanel aporta el gradiente) ── */
  testCard: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    ...glassTokens.shadow,
  },
  testCardContent: {
    flex: 1,
    marginRight: 10,
  },
  testCardTitle: {
    fontSize: 15,
    color: navy,
    marginBottom: 4,
    fontFamily: font.extraBold,
  },
  testCardDesc: {
    fontSize: 11,
    color: '#6b6557',
    lineHeight: 16,
    fontFamily: font.regular,
  },
  testMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  testMetaItem: {
    fontSize: 10,
    color: textSecondary,
    fontFamily: font.semiBold,
  },
  testMetaBullet: {
    fontSize: 10,
    color: textMuted,
    marginHorizontal: 6,
    fontFamily: font.semiBold,
  },
  testIllustration: {
    alignItems: 'center',
    gap: 4,
  },
  /* ── Tips personalizados ── */
  tipsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 14,
    color: navy,
    fontFamily: font.extraBold,
  },
  tipsBadge: {
    fontSize: 10,
    color: '#c1912c',
    fontFamily: font.bold,
  },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tipCardWrap: {
    width: '48.5%',
    marginBottom: 12,
  },
  tipCard: {
    padding: 13,
    borderRadius: 20,
  },
  tipIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 12.5,
    color: navy,
    marginBottom: 4,
    fontFamily: font.extraBold,
  },
  tipDesc: {
    fontSize: 10.5,
    color: '#7a7466',
    lineHeight: 15,
    fontFamily: font.regular,
  },
  tipButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 10,
  },
  tipButtonText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: font.bold,
  },
  resourcesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resourceLabel: {
    fontSize: 10,
    color: textSecondary,
    fontFamily: font.semiBold,
  },
  /* ── Llamado a acción principal ── */
  ctaButton: {
    backgroundColor: navy,
    borderRadius: 18,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 14,
    marginRight: 6,
    fontFamily: font.extraBold,
  },
  ctaArrow: {
    color: yellowSoft,
    fontSize: 16,
    fontFamily: font.bold,
  },
});
