import { StyleSheet } from 'react-native';

import { fontFamily as font } from '@/shared/theme/typography';
import { warmPalette as palette } from '@/shared/theme/warmPalette';

/* Misma paleta cálida que registerForm.styles.ts. */
export const styles = StyleSheet.create({
  group: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: palette.navy,
    marginBottom: 8,
    fontFamily: font.bold,
  },
  trigger: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: palette.inputBorder,
    paddingHorizontal: 14,
    gap: 12,
  },
  triggerDisabled: {
    opacity: 0.55,
  },
  triggerText: {
    flex: 1,
    fontSize: 16,
    color: palette.navy,
    fontFamily: font.semiBold,
  },
  placeholder: {
    color: palette.placeholder,
    fontFamily: font.regular,
  },
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  list: {
    marginTop: 6,
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: palette.inputBorder,
    overflow: 'hidden',
  },
  listScroll: {
    maxHeight: 220,
  },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
  },
  optionActive: {
    backgroundColor: palette.goldSoft,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: palette.navy,
    fontFamily: font.regular,
  },
  optionTextActive: {
    fontFamily: font.bold,
  },
  hint: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: palette.textSecondary,
    fontFamily: font.regular,
  },
});
