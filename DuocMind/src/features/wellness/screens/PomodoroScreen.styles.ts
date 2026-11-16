import { StyleSheet } from 'react-native';

import { fontFamily as font } from '@/shared/theme/typography';
import { resourceColors } from '../components/resourceStyles';

const { cream, navy, yellow, ivory, border, muted } = resourceColors;

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: cream },
  body: { flex: 1 },
  content: { paddingHorizontal: 22, paddingBottom: 80 },
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
  eyebrow: { fontSize: 12, letterSpacing: 1.6, color: muted, fontFamily: font.bold },
  title: { fontSize: 30, lineHeight: 36, color: navy, fontFamily: font.extraBold, marginBottom: 20 },

  /* ── Reloj ── */
  timerCard: {
    backgroundColor: navy,
    borderRadius: 28,
    padding: 22,
    alignItems: 'center',
    marginBottom: 20,
  },
  timerCardBreak: { backgroundColor: '#3d6b5a' },
  phaseLabel: { fontSize: 14, color: yellow, fontFamily: font.bold },
  time: {
    fontSize: 64,
    lineHeight: 76,
    color: '#ffffff',
    fontFamily: font.extraBold,
    marginVertical: 10,
    fontVariant: ['tabular-nums'],
  },
  buttons: { flexDirection: 'row', gap: 10 },
  button: {
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: { backgroundColor: yellow, borderColor: yellow },
  buttonText: { fontSize: 15, color: '#ffffff', fontFamily: font.extraBold },
  buttonTextPrimary: { color: navy },

  /* ── Configuración ── */
  card: {
    backgroundColor: ivory,
    borderWidth: 1,
    borderColor: border,
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, color: navy, fontFamily: font.extraBold, marginBottom: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  stepperDisabled: { opacity: 0.45 },
  stepperLabel: { flex: 1, fontSize: 15, color: navy, fontFamily: font.semiBold },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: { fontSize: 22, lineHeight: 26, color: yellow, fontFamily: font.extraBold },
  stepperValue: { width: 76, textAlign: 'center', fontSize: 16, color: navy, fontFamily: font.extraBold },
  total: { fontSize: 13, color: muted, fontFamily: font.regular, marginTop: 8 },

  /* ── Burbuja ? de la guía ── */
  helpAnchor: { position: 'absolute', right: 18, bottom: 4 },
  helpBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 253, 247, 0.96)',
    borderWidth: 1,
    borderColor: border,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  helpBubbleText: { fontSize: 19, lineHeight: 22, color: navy, fontFamily: font.extraBold },

  /* ── Última sesión ── */
  lastSession: { backgroundColor: '#e1e7f8', borderRadius: 18, padding: 16 },
  lastSessionText: { fontSize: 14, lineHeight: 20, color: navy, fontFamily: font.semiBold },
});
