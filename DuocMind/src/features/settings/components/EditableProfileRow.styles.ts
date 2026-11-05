import { StyleSheet } from 'react-native';

import { glassTokens } from '@/shared/components/Glass';
import { fontFamily as font } from '@/shared/theme/typography';

const navy = '#1a2b44';
const textSecondary = '#8a8272';

export const styles = StyleSheet.create({
  row: {
    paddingVertical: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: glassTokens.border,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.6,
    color: textSecondary,
    marginBottom: 2,
    fontFamily: font.bold,
  },
  readRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  readText: {
    flex: 1,
  },
  value: {
    fontSize: 15,
    lineHeight: 21,
    color: navy,
    fontFamily: font.semiBold,
  },
  /* Dato fijo: más apagado y de peso normal para que no parezca editable. */
  valueLocked: {
    color: textSecondary,
    fontFamily: font.regular,
  },
  fieldLabel: {
    fontSize: 12,
    color: textSecondary,
    marginTop: 6,
    marginBottom: 2,
    fontFamily: font.regular,
  },
  fieldSpaced: {
    marginTop: 2,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.5,
    borderColor: navy,
    borderRadius: 12,
    overflow: 'hidden',
  },
  /* Parte fija: se ve distinta del texto editable para que no parezca borrable. */
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(26, 43, 68, 0.06)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(26, 43, 68, 0.12)',
  },
  input: {
    flex: 1,
    minHeight: 44,
    fontSize: 15,
    color: navy,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: font.regular,
  },
  inputError: {
    borderColor: '#9b3d33',
  },
  hint: {
    fontSize: 11,
    lineHeight: 16,
    color: textSecondary,
    marginTop: 6,
    fontFamily: font.regular,
  },
  notice: {
    fontSize: 12,
    lineHeight: 17,
    color: '#2b7a53',
    marginTop: 6,
    fontFamily: font.regular,
  },
  error: {
    fontSize: 12,
    lineHeight: 17,
    color: '#9b3d33',
    marginTop: 6,
    fontFamily: font.regular,
  },
  saving: {
    alignItems: 'flex-start',
    marginTop: 6,
  },
});
