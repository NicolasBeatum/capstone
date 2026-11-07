import { StyleSheet } from 'react-native';

import { fontFamily as font } from '@/shared/theme/typography';

/* ── Paleta cálida del diseño de referencia ── */
const cream = '#f5eee2';
const navy = '#1a2b44';
const yellow = '#f2c14e';
const ivory = '#fff8ec';
const textSecondary = '#6b6458';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: cream,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 24,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.6,
    color: textSecondary,
    fontFamily: font.bold,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    color: navy,
    marginTop: 2,
    marginBottom: 22,
    fontFamily: font.extraBold,
  },

  eventsCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 22, backgroundColor: '#e1e7f8', marginBottom: 22, minHeight: 72 },
  eventsTitle: { fontFamily: font.extraBold, fontSize: 17, color: navy },
  eventsDesc: { fontFamily: font.regular, fontSize: 13, color: navy, marginTop: 4 },
  eventsArrow: { fontSize: 24, color: navy },

  /* ── Tarjeta principal del test ── */
  heroCard: {
    backgroundColor: navy,
    borderRadius: 28,
    padding: 22,
    marginBottom: 28,
    shadowColor: navy,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: yellow,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 14,
  },
  heroBadgeText: {
    fontSize: 12,
    color: navy,
    fontFamily: font.extraBold,
  },
  heroTitle: {
    fontSize: 23,
    lineHeight: 29,
    color: '#ffffff',
    fontFamily: font.extraBold,
    marginBottom: 12,
  },
  heroDesc: {
    fontSize: 13,
    lineHeight: 20,
    color: '#cbd5e1',
    fontFamily: font.semiBold,
    marginBottom: 20,
  },
  heroButton: {
    backgroundColor: ivory,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  heroButtonText: {
    fontSize: 15,
    color: navy,
    fontFamily: font.extraBold,
  },

  sectionTitle: {
    fontSize: 18,
    color: navy,
    fontFamily: font.extraBold,
    marginBottom: 14,
  },

  /* ── Ayuda ── */
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbe1d3',
    borderWidth: 1,
    borderColor: '#f2c3a6',
    borderRadius: 22,
    padding: 16,
    gap: 14,
  },
  helpIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: ivory,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 15,
    color: '#6b2a12',
    fontFamily: font.extraBold,
  },
  helpDesc: {
    fontSize: 12,
    color: '#7a4a35',
    marginTop: 2,
    fontFamily: font.semiBold,
  },
  helpArrow: {
    fontSize: 22,
    color: '#6b2a12',
    fontFamily: font.extraBold,
  },
});
