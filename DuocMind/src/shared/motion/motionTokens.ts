import { Easing, Platform } from 'react-native';

/**
 * Tokens de movimiento de DuocMind. Toda animación de la app toma de aquí sus
 * duraciones, curvas y distancias para que el ritmo sea calmado y consistente.
 * No hay rebotes: ninguna curva ni resorte sobrepasa su valor final.
 */
export const motionDuration = {
  /** Transición entre pantallas. */
  screen: 500,
  /** Entrada de una tarjeta o elemento de lista. */
  reveal: 500,
  /** Pausa entre un elemento y el siguiente en entradas escalonadas. */
  stagger: 70,
  /** Compresión al tocar un botón. */
  pressIn: 140,
  /** Regreso al soltar un botón. */
  pressOut: 260,
  /** Ajuste de la barra de ánimo al soltarla. */
  snap: 400,
  /** Un ciclo del indicador de carga (la gota); lento a propósito. */
  loaderCycle: 2400,
  /** Inhalar: el fondo se expande. */
  inhale: 4000,
  /** Exhalar: el fondo se recoge. */
  exhale: 6000,
} as const;

export const motionEasing = {
  /** Ease-in-out suave para entradas y transiciones. */
  calm: Easing.bezier(0.45, 0, 0.25, 1),
  /** Salida suave para microinteracciones. */
  soft: Easing.out(Easing.quad),
  /** Respiración: arranque y final casi imperceptibles. */
  breath: Easing.inOut(Easing.sin),
} as const;

export const motionDistance = {
  /** Desplazamiento vertical de entrada, en px. */
  rise: 12,
  /** Escala al tocar botones y caritas. */
  pressScale: 0.96,
  /** Escala máxima del fondo al inhalar; muy sutil. */
  breathScale: 1.05,
  /** Opacidad del fondo al exhalar y al inhalar. */
  breathOpacityMin: 0.82,
  breathOpacityMax: 1,
} as const;

/** El driver nativo no existe en web; evita advertencias en la previsualización. */
export const NATIVE_DRIVER = Platform.OS !== 'web';
