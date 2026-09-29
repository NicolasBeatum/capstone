import { StyleSheet } from 'react-native';

import { glassTokens } from '@/shared/components/glass';
import { fontFamily as font } from '@/shared/typography';

/* ── Paleta cálida compartida con el resto de la app ── */
const cream = '#f3ecda';
const navy = '#1a2b44';
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
  /* ── Header ── */
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
  },
  avatarInitials: {
    color: yellowSoft,
    fontSize: 14,
    fontFamily: font.extraBold,
  },
  /* ── Tarjeta de identidad (GlassCard aporta fondo, borde y sombra) ── */
  profileCard: {
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: navy,
    borderWidth: 2,
    borderColor: yellowSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileAvatarText: {
    color: yellowSoft,
    fontSize: 22,
    fontFamily: font.extraBold,
  },
  profileName: {
    fontSize: 18,
    color: navy,
    fontFamily: font.extraBold,
  },
  profileEmail: {
    fontSize: 12,
    color: textSecondary,
    marginTop: 3,
    fontFamily: font.regular,
  },
  /* ── Menú de opciones (GlassCard aporta fondo, borde y sombra) ── */
  menuCard: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: glassTokens.border,
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(249, 221, 133, 0.35)',
    borderWidth: 1,
    borderColor: glassTokens.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 13,
    color: navy,
    fontFamily: font.bold,
  },
  menuLabelDanger: {
    color: '#e11d48',
  },
  menuChevron: {
    fontSize: 20,
    color: textSecondary,
    fontFamily: font.bold,
  },
});
