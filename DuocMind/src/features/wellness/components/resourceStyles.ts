import { StyleSheet } from 'react-native';

import { fontFamily as font } from '@/shared/theme/typography';

/* Paleta cálida de Bienestar, la misma de WellnessScreen. */
export const resourceColors = {
  cream: '#f5eee2',
  navy: '#1a2b44',
  yellow: '#f2c14e',
  ivory: '#fff8ec',
  border: '#e6dcc8',
  muted: '#6b6458',
  accent: '#2f4ea3',
} as const;

const { navy, yellow, ivory, border, muted } = resourceColors;

export const resourceStyles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  title: {
    fontSize: 18,
    color: navy,
    fontFamily: font.extraBold,
    marginBottom: 12,
  },

  /* ── Chips de categoría ── */
  chipsContent: {
    gap: 8,
    paddingRight: 4,
    paddingBottom: 2,
  },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 999,
    justifyContent: 'center',
    backgroundColor: ivory,
    borderWidth: 1,
    borderColor: border,
  },
  chipSelected: {
    backgroundColor: navy,
    borderColor: navy,
  },
  chipText: {
    fontSize: 14,
    color: navy,
    fontFamily: font.semiBold,
  },
  chipTextSelected: {
    color: yellow,
    fontFamily: font.extraBold,
  },

  /* ── Lista ── */
  list: {
    marginTop: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 44,
    padding: 10,
    borderRadius: 18,
    backgroundColor: ivory,
    borderWidth: 1,
    borderColor: border,
    marginBottom: 8,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    lineHeight: 19,
    color: navy,
    fontFamily: font.extraBold,
  },
  rowDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: muted,
    fontFamily: font.regular,
    marginTop: 2,
  },
  rowVideo: {
    fontSize: 12,
    color: resourceColors.accent,
    fontFamily: font.bold,
    marginTop: 4,
  },

  /* ── Estados ── */
  stateBox: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  stateText: {
    fontSize: 14,
    lineHeight: 20,
    color: muted,
    fontFamily: font.regular,
    textAlign: 'center',
  },
  stateTitle: {
    fontSize: 15,
    color: navy,
    fontFamily: font.extraBold,
    textAlign: 'center',
    marginBottom: 4,
  },
  retryButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  retryText: {
    fontSize: 14,
    color: yellow,
    fontFamily: font.extraBold,
  },
  notice: {
    fontSize: 12,
    lineHeight: 17,
    color: muted,
    fontFamily: font.regular,
    marginBottom: 10,
  },
});
