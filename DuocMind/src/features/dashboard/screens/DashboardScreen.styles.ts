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
  content: {
    flex: 1,
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
  headerCompact: { flexWrap: 'wrap', gap: 8 },
  headerTextCompact: { flexBasis: '100%', marginRight: 0 },
  headerControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerControlsCompact: { width: '100%', justifyContent: 'flex-end' },
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
    fontSize: 13,
    color: textSecondary,
    fontFamily: font.semiBold,
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
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: glassTokens.surfaceStrong,
    borderWidth: 1,
    borderColor: glassTokens.border,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: navy,
    alignItems: 'center',
    justifyContent: 'center',
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
  /* ── Se viene: línea de tiempo por día ── */
  upcomingCard: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 10,
    marginBottom: 22,
  },
  upcomingEmpty: {
    fontSize: 13,
    lineHeight: 19,
    color: textSecondary,
    paddingBottom: 6,
    fontFamily: font.regular,
  },
  dayGroupSpaced: {
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(138, 130, 114, 0.16)',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  dayWhen: {
    fontSize: 13,
    color: textSecondary,
    fontFamily: font.bold,
  },
  /* Hoy y mañana se leen primero: mismo tono que los títulos. */
  dayWhenUrgent: {
    color: navy,
    fontFamily: font.extraBold,
  },
  dayDate: {
    fontSize: 12,
    color: textSecondary,
    fontFamily: font.semiBold,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 44,
    paddingVertical: 8,
  },
  eventRail: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  railExam: { backgroundColor: '#3d5fb8' },
  railTask: { backgroundColor: '#d0803d' },
  railPersonal: { backgroundColor: '#3f9468' },
  eventBody: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    lineHeight: 20,
    color: navy,
    fontFamily: font.extraBold,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 2,
  },
  eventKind: {
    fontSize: 12,
    fontFamily: font.bold,
  },
  kindTextExam: { color: '#2f4e9e' },
  kindTextTask: { color: '#a3531b' },
  kindTextPersonal: { color: '#2b7a53' },
  eventDetail: {
    flexShrink: 1,
    fontSize: 12,
    color: textSecondary,
    fontFamily: font.regular,
  },
  /* ── Para ti hoy ── */
  forYouTitle: {
    marginBottom: 10,
  },
  forYouTile: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    padding: 14,
    marginBottom: 18,
    backgroundColor: '#e6e0f5',
    borderWidth: 1,
    borderColor: glassTokens.border,
  },
  forYouIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  forYouText: {
    flex: 1,
  },
  forYouTitleText: {
    fontSize: 15,
    color: navy,
    fontFamily: font.extraBold,
  },
  forYouDesc: {
    fontSize: 12,
    color: textSecondary,
    marginTop: 2,
    fontFamily: font.regular,
  },
  /* ── Apoyo: tarjeta tranquila, sin tonos de alarma ──
   * El margen inferior la deja por encima de la burbuja de ayuda al llegar al final. */
  supportCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 253, 247, 0.92)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(70, 138, 108, 0.24)',
    padding: 16,
    marginBottom: 60,
  },
  supportMark: {
    width: 52,
    height: 44,
    marginRight: 14,
    marginTop: 2,
  },
  supportVoice: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  supportVoiceA: {
    top: 0,
    left: 0,
    backgroundColor: 'rgba(107, 90, 168, 0.30)',
  },
  supportVoiceB: {
    top: 10,
    left: 18,
    backgroundColor: 'rgba(70, 138, 108, 0.34)',
  },
  supportText: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 15,
    lineHeight: 20,
    color: navy,
    fontFamily: font.extraBold,
  },
  supportBody: {
    fontSize: 13,
    lineHeight: 19,
    color: textSecondary,
    marginTop: 4,
    fontFamily: font.regular,
  },
  supportAction: {
    alignSelf: 'flex-start',
    marginTop: 12,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(70, 138, 108, 0.13)',
  },
  supportActionText: {
    fontSize: 13,
    color: '#2b6b50',
    fontFamily: font.bold,
  },
  /* ── Burbuja de ayuda: abre el tutorial ── */
  helpAnchor: {
    position: 'absolute',
    right: 18,
    bottom: 4,
  },
  helpBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 253, 247, 0.96)',
    borderWidth: 1,
    borderColor: glassTokens.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...glassTokens.shadow,
  },
  helpBubbleText: {
    fontSize: 19,
    lineHeight: 22,
    color: navy,
    fontFamily: font.extraBold,
  },
});
