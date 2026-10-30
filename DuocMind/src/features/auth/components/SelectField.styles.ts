import { StyleSheet } from 'react-native';

import { glassTokens } from '@/shared/components/Glass';
import { fontFamily as font } from '@/shared/theme/typography';

/* Misma paleta cálida que authForm.styles.ts. */
const navy = '#1a2b44';
const yellowSoft = '#f9dd85';
const textSecondary = '#8a8272';
const textMuted = '#b0a891';

export const styles = StyleSheet.create({
  group: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: navy,
    marginBottom: 6,
    fontFamily: font.bold,
  },
  trigger: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: glassTokens.surfaceStrong,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: glassTokens.border,
    paddingHorizontal: 14,
    gap: 10,
  },
  triggerDisabled: {
    opacity: 0.55,
  },
  triggerText: {
    flex: 1,
    fontSize: 13,
    color: navy,
    fontFamily: font.regular,
  },
  placeholder: {
    color: textMuted,
  },
  chevron: {
    fontSize: 12,
    color: textSecondary,
    fontFamily: font.bold,
  },
  list: {
    marginTop: 6,
    backgroundColor: glassTokens.surfaceStrong,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: glassTokens.border,
    overflow: 'hidden',
  },
  listScroll: {
    maxHeight: 220,
  },
  option: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
  },
  optionActive: {
    backgroundColor: 'rgba(249, 221, 133, 0.35)',
  },
  optionText: {
    flex: 1,
    fontSize: 13,
    color: navy,
    fontFamily: font.regular,
  },
  optionTextActive: {
    fontFamily: font.bold,
  },
  optionCheck: {
    color: navy,
    backgroundColor: yellowSoft,
    borderRadius: 8,
    paddingHorizontal: 5,
    fontSize: 12,
    fontFamily: font.extraBold,
  },
  hint: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 16,
    color: textSecondary,
    fontFamily: font.regular,
  },
});
