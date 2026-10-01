import { StyleSheet } from 'react-native';

import { glassTokens } from '@/shared/components/Glass';
import { fontFamily as font } from '@/shared/theme/typography';

/* ── Paleta cálida compartida con el dashboard, con superficies liquid ── */
const cream = '#f3ecda';
const navy = '#1a2b44';
const yellow = '#f2c14e';
const yellowSoft = '#f9dd85';
const textSecondary = '#8a8272';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: cream,
  },
  container: {
    flex: 1,
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
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: yellowSoft,
    fontSize: 16,
    fontFamily: font.extraBold,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  greetingTitle: {
    fontSize: 23,
    color: navy,
    lineHeight: 27,
    fontFamily: font.extraBold,
  },
  greetingSubtitle: {
    fontSize: 12,
    color: textSecondary,
    marginTop: 1,
    fontFamily: font.regular,
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
  /* ── Selector de ánimo (LiquidCard aporta fondo, borde y sombra) ── */
  moodCardContainer: {
    padding: 18,
    paddingTop: 22,
    marginBottom: 18,
  },
  moodCardDecoration: {
    position: 'absolute',
    top: 14,
    right: 16,
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodCard: {
    width: '18%',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 18,
  },
  moodCardSelected: {
    backgroundColor: 'rgba(249, 221, 133, 0.9)',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  moodIcon: {
    marginBottom: 6,
  },
  moodLabel: {
    fontSize: 11,
    color: textSecondary,
    fontFamily: font.semiBold,
  },
  moodLabelSelected: {
    color: navy,
    fontFamily: font.extraBold,
  },
  /* Botón guardar */
  saveButton: {
    backgroundColor: navy,
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    marginBottom: 24,
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
  checkinFeedbackError: {
    color: '#9b3d33',
    fontSize: 12,
    lineHeight: 17,
    marginTop: -10,
    marginBottom: 16,
    textAlign: 'center',
  },
  historySection: {
    marginTop: 6,
    marginBottom: 24,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  historyTitle: {
    color: navy,
    fontSize: 17,
    fontWeight: '800',
  },
  historyHint: {
    color: textSecondary,
    fontSize: 11,
  },
  historyEmpty: {
    color: textSecondary,
    fontSize: 13,
    paddingVertical: 14,
  },
  historyLoginLink: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: 40,
    paddingVertical: 10,
  },
  historyLoginText: {
    color: navy,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(26, 43, 68, 0.10)',
  },
  historyItemText: {
    flex: 1,
    paddingRight: 12,
  },
  historyMood: {
    color: navy,
    fontSize: 14,
    fontWeight: '700',
  },
  historyDate: {
    color: textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  historySync: {
    color: textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  deleteButton: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  deleteButtonText: {
    color: '#9b3d33',
    fontSize: 12,
    fontWeight: '700',
  },
});
