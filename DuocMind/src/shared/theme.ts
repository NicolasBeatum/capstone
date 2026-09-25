/**
 * Sistema de tokens de color para DuocMind.
 * Soporta modo claro y oscuro automáticamente.
 * Usa: const theme = useTheme();
 */
import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';

const light = {
  isDark: false,
  /* Superficies base */
  background: '#f0f4f8',
  surface: 'rgba(255, 255, 255, 0.75)',
  surfaceStrong: 'rgba(255, 255, 255, 0.92)',

  /* Glassmorphism — modo claro */
  glass: 'rgba(255, 255, 255, 0.55)',
  glassBorder: 'rgba(255, 255, 255, 0.80)',
  glassSpecular: 'rgba(255, 255, 255, 0.70)',
  glassDark: 'rgba(26, 43, 68, 0.87)',
  glassDarkBorder: 'rgba(255, 255, 255, 0.18)',

  /* Marca */
  navy: '#1a2b44',
  navyLight: '#243a5e',
  yellow: '#f3e7a0',
  yellowLight: '#fbf6dc',
  yellowDark: '#d4b43c',

  /* Orbes de luz líquida */
  orbPrimary: 'rgba(243, 231, 160, 0.50)',
  orbSecondary: 'rgba(36, 58, 94, 0.16)',
  orbTertiary: 'rgba(212, 180, 60, 0.22)',

  /* Textos */
  textPrimary: '#1a2b44',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textOnDark: '#ffffff',
  textOnDarkMuted: '#cbd5e1',
  textAccent: '#f3e7a0',

  /* Separadores */
  border: 'rgba(203, 213, 225, 0.60)',
  divider: 'rgba(241, 245, 249, 0.90)',

  /* Estados */
  online: '#10b981',
  danger: '#e11d48',
};

const dark = {
  isDark: true,
  /* Superficies base */
  background: '#070c14',
  surface: 'rgba(15, 25, 42, 0.80)',
  surfaceStrong: 'rgba(22, 36, 58, 0.95)',

  /* Glassmorphism — modo oscuro (Smoked Glass) */
  glass: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.14)',
  glassSpecular: 'rgba(255, 255, 255, 0.22)',
  glassDark: 'rgba(10, 18, 32, 0.90)',
  glassDarkBorder: 'rgba(255, 255, 255, 0.12)',

  /* Marca (colores idénticos, los orbes solo cambian intensidad) */
  navy: '#1a2b44',
  navyLight: '#243a5e',
  yellow: '#f3e7a0',
  yellowLight: '#fbf6dc',
  yellowDark: '#d4b43c',

  /* Orbes de luz líquida (más intensos en oscuro) */
  orbPrimary: 'rgba(243, 231, 160, 0.18)',
  orbSecondary: 'rgba(52, 96, 160, 0.28)',
  orbTertiary: 'rgba(212, 180, 60, 0.14)',

  /* Textos */
  textPrimary: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textOnDark: '#ffffff',
  textOnDarkMuted: '#cbd5e1',
  textAccent: '#f3e7a0',

  /* Separadores */
  border: 'rgba(255, 255, 255, 0.10)',
  divider: 'rgba(255, 255, 255, 0.07)',

  /* Estados */
  online: '#10b981',
  danger: '#fb7185',
};

export type AppTheme = typeof light;

// Theme fixed to light only: remove system-based theming so the app always uses the colors defined here

// Theme context so the app uses a single source of truth
const ThemeContext = createContext<AppTheme>(light);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = light; // always use the light theme defined above
  // Return provider using React.createElement to keep this file as .ts
  return React.createElement(ThemeContext.Provider, { value: theme }, children);
}

export function useTheme(): AppTheme {
  return useContext(ThemeContext);
}

