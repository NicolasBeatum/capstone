import { StyleSheet } from 'react-native';
import { fontFamily as font } from '@/shared/theme/typography';

export const importStyles = StyleSheet.create({
  section: { gap: 12 },
  sectionTitle: { fontFamily: font.extraBold, fontSize: 20, color: '#1a2b44' },
  meta: { fontFamily: font.semiBold, fontSize: 13, color: '#596273' },
  check: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#1a2b44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: '#1a2b44' },
  boxMark: { fontFamily: font.extraBold, fontSize: 14, lineHeight: 16, color: '#fff' },
  checkText: { flex: 1, fontFamily: font.semiBold, fontSize: 14, lineHeight: 20, color: '#1a2b44' },
  checkTextOff: { color: '#8a8272', textDecorationLine: 'line-through' },
  excluded: { opacity: 0.6 },
  steps: { gap: 6 },
  step: { fontFamily: font.regular, fontSize: 14, lineHeight: 21, color: '#465266' },
  loader: { alignItems: 'center', paddingVertical: 24 },
  actions: { gap: 10 },
});
