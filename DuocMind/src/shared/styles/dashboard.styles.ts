import { StyleSheet } from 'react-native';

import { glassTokens } from '@/shared/components/glass';

/* ── Paleta cálida alineada al diseño de referencia, con superficies glass/liquid ── */
const cream = '#f3ecda';
const navy = '#1a2b44';
const yellow = '#f2c14e';
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
    fontWeight: '800',
  },
  headerText: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: navy,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: textSecondary,
    marginTop: 2,
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
    backgroundColor: yellow,
    borderWidth: 1.5,
    borderColor: cream,
  },
  /* ── Tu semana de un vistazo (GlassCard aporta fondo, borde y sombra) ── */
  weekCard: {
    padding: 18,
    marginBottom: 20,
  },
  weekCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weekCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: navy,
  },
  weekCardLink: {
    fontSize: 12,
    fontWeight: '600',
    color: textSecondary,
  },
  /* ── Banner del test semanal (LiquidPanel aporta el gradiente) ── */
  testBanner: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    ...glassTokens.shadow,
  },
  testBannerContent: {
    flex: 1,
    marginRight: 10,
  },
  testBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: glassTokens.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  testBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: navy,
  },
  testBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: navy,
    marginBottom: 4,
  },
  testBannerDesc: {
    fontSize: 11,
    color: '#6b6557',
    marginBottom: 12,
  },
  testBannerButton: {
    backgroundColor: navy,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  testBannerButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  testBannerButtonArrow: {
    color: yellowSoft,
    fontSize: 14,
    fontWeight: 'bold',
  },
  testBannerIllustration: {
    alignItems: 'center',
    marginLeft: 4,
    gap: 4,
  },
  /* ── Accesos rápidos ── */
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickTileWrap: {
    width: '48.5%',
    marginBottom: 12,
  },
  quickTile: {
    padding: 16,
  },
  quickIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(249, 221, 133, 0.45)',
    borderWidth: 1,
    borderColor: glassTokens.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: navy,
  },
  /* ── Pausa sugerida (GlassCard aporta fondo, borde y sombra) ── */
  recommendCard: {
    marginBottom: 4,
  },
  recommendGlass: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recommendIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(249, 221, 133, 0.35)',
    borderWidth: 1,
    borderColor: glassTokens.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendText: {
    flex: 1,
    marginLeft: 12,
  },
  recommendEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: textMuted,
    marginBottom: 2,
  },
  recommendTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: navy,
  },
  recommendDesc: {
    fontSize: 11,
    color: textSecondary,
    marginTop: 2,
  },
  recommendChevron: {
    fontSize: 22,
    color: textMuted,
    marginLeft: 6,
  },
});
