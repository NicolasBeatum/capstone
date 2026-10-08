import { StyleSheet } from 'react-native';

import { glassTokens } from '@/shared/components/Glass';
import { fontFamily as font } from '@/shared/theme/typography';

/* ── Paleta cálida alineada al diseño de referencia, con superficies glass/liquid ── */
const cream = '#f3ecda';
const navy = '#1a2b44';
const navyDeep = '#1b2a44';
const yellow = '#f2c14e';
const yellowSoft = '#f9dd85';
const textSecondary = '#8a8272';

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
  /* ── Header: fecha y saludo ── */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    // Deja aire antes de la campana para que un nombre largo no la toque.
    marginRight: 6,
  },
  dateEyebrow: {
    fontSize: 11,
    letterSpacing: 0.8,
    color: textSecondary,
    fontFamily: font.bold,
  },
  greetingTitle: {
    fontSize: 26,
    lineHeight: 32,
    color: navy,
    marginTop: 2,
    fontFamily: font.extraBold,
  },
  greetingHidden: {
    opacity: 0,
  },
  bellButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
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
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
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
  /* ── Vistazo de tu semana (LiquidCard aporta fondo, borde y sombra) ── */
  weekCard: {
    padding: 18,
    marginBottom: 16,
  },
  weekCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weekCardTitle: {
    fontSize: 16,
    color: navy,
    fontFamily: font.extraBold,
  },
  weekCardLink: {
    fontSize: 12,
    color: navy,
    fontFamily: font.bold,
  },
  insightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fbebc4',
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
  },
  insightIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  insightTextBox: {
    flex: 1,
  },
  insightText: {
    fontSize: 13,
    lineHeight: 19,
    color: navy,
    fontFamily: font.regular,
  },
  insightStrong: {
    fontFamily: font.extraBold,
  },
  /* ── Clase en curso ── */
  classCard: {
    backgroundColor: navyDeep,
    borderRadius: 24,
    padding: 18,
    marginBottom: 22,
    ...glassTokens.shadow,
  },
  classTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  classBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: yellow,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  classBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: navyDeep,
    marginRight: 6,
  },
  classBadgeText: {
    fontSize: 12,
    color: navyDeep,
    fontFamily: font.extraBold,
  },
  classRemaining: {
    fontSize: 12,
    color: '#cbd5e1',
    fontFamily: font.bold,
  },
  className: {
    fontSize: 24,
    color: '#ffffff',
    fontFamily: font.extraBold,
  },
  classMeta: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 4,
    fontFamily: font.regular,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: yellow,
  },
  classBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    marginTop: 14,
    paddingTop: 12,
  },
  classNext: {
    fontSize: 12,
    color: '#cbd5e1',
    fontFamily: font.regular,
  },
  classNextStrong: {
    color: '#ffffff',
    fontFamily: font.extraBold,
  },
  classLink: {
    fontSize: 12,
    color: yellow,
    fontFamily: font.extraBold,
  },
  /* ── Secciones ── */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    color: navy,
    fontFamily: font.extraBold,
  },
  sectionLink: {
    fontSize: 12,
    color: navy,
    fontFamily: font.bold,
  },
  /* ── Se viene ── */
  upcomingCard: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 22,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  upcomingRowDivider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(138, 130, 114, 0.18)',
  },
  dateBadge: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBadgeExam: { backgroundColor: '#dfe7fb' },
  dateBadgeDelivery: { backgroundColor: '#fbe3cd' },
  dateBadgeOral: { backgroundColor: '#d9efe3' },
  dateWeekday: {
    fontSize: 9,
    letterSpacing: 0.5,
    fontFamily: font.extraBold,
  },
  dateDay: {
    fontSize: 19,
    lineHeight: 22,
    fontFamily: font.extraBold,
  },
  dateTextExam: { color: '#2f4e9e' },
  dateTextDelivery: { color: '#a3531b' },
  dateTextOral: { color: '#2b7a53' },
  upcomingText: {
    flex: 1,
    marginHorizontal: 12,
  },
  upcomingTitle: {
    fontSize: 14,
    color: navy,
    fontFamily: font.extraBold,
  },
  upcomingDetail: {
    fontSize: 11,
    color: textSecondary,
    marginTop: 2,
    fontFamily: font.regular,
  },
  whenChip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  whenChipUrgent: { backgroundColor: '#fbdcc9' },
  whenChipCalm: { backgroundColor: '#ece6d6' },
  whenText: {
    fontSize: 11,
    fontFamily: font.extraBold,
  },
  whenTextUrgent: { color: '#a3531b' },
  whenTextCalm: { color: '#5c5646' },
  /* ── Para ti hoy ── */
  forYouTitle: {
    marginBottom: 10,
  },
  forYouRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  forYouTile: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
    minHeight: 128,
    borderWidth: 1,
    borderColor: glassTokens.border,
  },
  forYouBreathe: { backgroundColor: '#e6e0f5' },
  forYouTitleText: {
    fontSize: 15,
    color: navy,
    marginTop: 14,
    fontFamily: font.extraBold,
  },
  forYouDesc: {
    fontSize: 11,
    color: textSecondary,
    marginTop: 4,
    fontFamily: font.regular,
  },
  supportLink: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportLinkText: {
    fontSize: 12,
    color: textSecondary,
    textDecorationLine: 'underline',
    fontFamily: font.semiBold,
  },
});
