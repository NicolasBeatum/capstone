import { StyleSheet } from 'react-native';

import { fontFamily as font } from '@/shared/theme/typography';
import { resourceColors } from '../components/resourceStyles';

const { cream, navy, yellow, ivory, border, muted } = resourceColors;

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: cream,
  },
  content: {
    paddingHorizontal: 22,
    paddingBottom: 130,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ivory,
    borderWidth: 1,
    borderColor: border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  imageWrap: {
    alignItems: 'center',
    marginBottom: 18,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pillText: {
    fontSize: 12,
    fontFamily: font.bold,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    color: navy,
    fontFamily: font.extraBold,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: navy,
    fontFamily: font.semiBold,
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 23,
    color: '#3a4558',
    fontFamily: font.regular,
    marginBottom: 18,
  },

  /* ── Video externo ── */
  videoButton: {
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: 16,
    backgroundColor: navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoText: {
    fontSize: 15,
    color: yellow,
    fontFamily: font.extraBold,
  },
  videoCaption: {
    fontSize: 12,
    lineHeight: 17,
    color: muted,
    fontFamily: font.regular,
    marginTop: 8,
    marginBottom: 18,
  },
  videoError: {
    fontSize: 13,
    lineHeight: 18,
    color: '#9a3b1c',
    fontFamily: font.semiBold,
    marginBottom: 18,
  },

  /* ── Orientación y ayuda ── */
  notice: {
    backgroundColor: ivory,
    borderWidth: 1,
    borderColor: border,
    borderRadius: 18,
    padding: 16,
    marginTop: 4,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 19,
    color: muted,
    fontFamily: font.regular,
  },
  helpLink: {
    minHeight: 44,
    justifyContent: 'center',
    marginTop: 6,
  },
  helpLinkText: {
    fontSize: 13,
    color: resourceColors.accent,
    fontFamily: font.bold,
    textDecorationLine: 'underline',
  },

  /* ── Estados ── */
  stateBox: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 12,
  },
  stateTitle: {
    fontSize: 18,
    color: navy,
    fontFamily: font.extraBold,
    textAlign: 'center',
    marginBottom: 6,
  },
  stateText: {
    fontSize: 14,
    lineHeight: 20,
    color: muted,
    fontFamily: font.regular,
    textAlign: 'center',
  },
  stateButton: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 22,
    borderRadius: 999,
    backgroundColor: navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  stateButtonText: {
    fontSize: 14,
    color: yellow,
    fontFamily: font.extraBold,
  },
});
