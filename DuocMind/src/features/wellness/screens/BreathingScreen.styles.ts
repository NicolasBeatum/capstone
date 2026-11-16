import { StyleSheet } from 'react-native';

import { fontFamily as font } from '@/shared/theme/typography';
import { resourceColors } from '../components/resourceStyles';

const { cream, navy, yellow, ivory, border, muted } = resourceColors;

/** Tamaño del anillo de progreso y grosor de su línea. */
export const RING_SIZE = 260;
export const RING_STROKE = 8;
const CIRCLE_SIZE = RING_SIZE - 40;

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

  /* ── Círculo y anillo ── */
  stage: { alignItems: 'center' },
  ringBox: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSvg: { position: 'absolute', top: 0, left: 0 },
  circle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
  },
  circleLabel: { fontSize: 26, color: navy, fontFamily: font.extraBold, textAlign: 'center' },
  cycle: { fontSize: 14, color: muted, fontFamily: font.semiBold, marginTop: 18, marginBottom: 18 },

  /* ── Botón ── */
  button: {
    minHeight: 48,
    minWidth: 160,
    paddingHorizontal: 22,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: { backgroundColor: navy },
  buttonText: { fontSize: 15, color: navy, fontFamily: font.extraBold },
  buttonTextPrimary: { color: yellow },

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
});
