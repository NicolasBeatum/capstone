import { StyleSheet } from 'react-native';

import { glassTokens } from '@/shared/components/Glass';
import { fontFamily as font } from '@/shared/theme/typography';

/* Misma paleta cálida que las pantallas de autenticación y el dashboard. */
const cream = '#f3ecda';
const navy = '#1a2b44';
const textSecondary = '#8a8272';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: cream,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backButton: {
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
  backArrow: {
    fontSize: 16,
    color: navy,
    fontFamily: font.bold,
  },
  topBarTitle: {
    fontSize: 11,
    letterSpacing: 0.8,
    color: textSecondary,
    fontFamily: font.bold,
  },
  topBarSpacer: {
    width: 44,
  },
  intro: {
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    color: navy,
    fontFamily: font.extraBold,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: textSecondary,
    marginTop: 6,
    fontFamily: font.regular,
  },
  card: {
    padding: 18,
    marginBottom: 14,
  },
  sectionHeader: {
    marginTop: 18,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    color: navy,
    fontFamily: font.extraBold,
  },
  profileRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: glassTokens.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 12,
  },
  consentText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: navy,
    fontFamily: font.regular,
  },
  link: {
    minHeight: 44,
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 12,
    color: navy,
    textDecorationLine: 'underline',
    fontFamily: font.bold,
  },
  notice: {
    fontSize: 11,
    lineHeight: 16,
    color: textSecondary,
    marginTop: 4,
    fontFamily: font.regular,
  },
  error: {
    fontSize: 12,
    lineHeight: 17,
    color: '#9b3d33',
    marginTop: 8,
    fontFamily: font.regular,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: 24,
  },
});
