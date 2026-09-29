import { StyleSheet } from 'react-native';

import { glassTokens } from '@/shared/components/glass';
import { fontFamily as font } from '@/shared/typography';

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
  /* ── Emociones relacionadas (globos de diálogo) ── */
  tagsSectionLabel: {
    fontSize: 13,
    color: textSecondary,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: font.semiBold,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
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
});
