import { StyleSheet } from 'react-native';

import { fontFamily as font } from '@/shared/theme/typography';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  topShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginHorizontal: 3,
    borderRadius: 18,
  },
  /* Pill elevada de la pestaña activa */
  activePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.90)',
    shadowColor: '#6b5a33',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 6,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 3,
    fontFamily: font.bold,
  },
});
