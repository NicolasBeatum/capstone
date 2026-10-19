import { StyleSheet } from 'react-native';

import { fontFamily as font } from '@/shared/theme/typography';

const FAB_SIZE = 62;

export const styles = StyleSheet.create({
  /* Contenedor transparente: la barra flota sobre el fondo de cada pantalla */
  wrapper: {
    paddingHorizontal: 14,
    paddingTop: 28,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: '#6b5a33',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 14,
    overflow: 'hidden',
  },
  topShine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1.5,
    borderRadius: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    marginHorizontal: 2,
    borderRadius: 18,
  },
  /* Pill elevada de la pestaña activa */
  activePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 3,
    fontFamily: font.bold,
  },
  centerSlot: {
    width: FAB_SIZE + 8,
  },
  fabAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: 22,
    backgroundColor: '#1a2b44',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#1a2b44',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 18,
  },
  fabActive: {
    borderColor: '#f2c14e',
  },
});
