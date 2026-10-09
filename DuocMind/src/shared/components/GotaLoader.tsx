import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { motionDuration, NATIVE_DRIVER } from '@/shared/motion/motionTokens';
import { useReducedMotion } from '@/shared/motion/useReducedMotion';
import { fontFamily as font } from '@/shared/theme/typography';

export type GotaLoaderSize = 'sm' | 'md' | 'lg';

interface GotaLoaderProps {
  size?: GotaLoaderSize;
  /** Texto opcional bajo la gota, por ejemplo "Respira mientras cargamos…". */
  text?: string;
  style?: StyleProp<ViewStyle>;
}

const COLOR = '#F2C14E';
const HALO = 'rgba(242, 193, 78, 0.25)';
const TEXT_COLOR = '#8a8272';
const SIZES: Record<GotaLoaderSize, number> = { sm: 48, md: 96, lg: 140 };
/** Medidas de referencia a 96 px; el resto se escala con el tamaño. */
const BASE = { size: 96, core: 28, halo: 8, ring: 2 };
const WAVE_DELAY = 0.35;
const SAMPLES = 96;

type Keyframes = Array<[time: number, value: number]>;

const calmEase = Easing.bezier(0.45, 0, 0.25, 1);
const waveEase = Easing.bezier(0.2, 0.6, 0.35, 1);

/** Valor de una pista de keyframes, con la curva aplicada en cada tramo. */
function sampleTrack(keys: Keyframes, ease: (t: number) => number, time: number): number {
  for (let i = 1; i < keys.length; i += 1) {
    const [t0, v0] = keys[i - 1];
    const [t1, v1] = keys[i];
    if (time <= t1) return v0 + (v1 - v0) * ease((time - t0) / (t1 - t0));
  }
  return keys[keys.length - 1][1];
}

/**
 * El driver nativo solo interpola linealmente, así que las curvas se muestrean
 * en muchos puntos y el ciclo completo corre con un único valor 0 → 1.
 */
function buildInterpolation(
  progress: Animated.Value,
  keys: Keyframes,
  ease: (t: number) => number,
  phase = 0,
) {
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let i = 0; i <= SAMPLES; i += 1) {
    const time = i / SAMPLES;
    inputRange.push(time);
    const shifted = time - phase;
    outputRange.push(sampleTrack(keys, ease, shifted < 0 ? shifted + 1 : shifted));
  }
  return progress.interpolate({ inputRange, outputRange });
}

const CORE_SCALE: Keyframes = [[0, 0.5], [0.35, 1.2], [0.6, 0.9], [1, 0.5]];
const CORE_OPACITY: Keyframes = [[0, 0.6], [0.35, 1], [1, 0.6]];
const WAVE_SCALE: Keyframes = [[0, 1], [1, 3.4]];
const WAVE_OPACITY: Keyframes = [[0, 0], [0.25, 0.7], [1, 0]];
const SOFT_PULSE: Keyframes = [[0, 1], [0.5, 0.5], [1, 1]];

/**
 * Indicador de carga "gota que respira": una gota que se expande y suelta dos
 * ondas que se alejan y se disuelven. Con movimiento reducido solo pulsa la opacidad.
 */
export function GotaLoader({ size = 'md', text, style }: GotaLoaderProps) {
  const reduceMotion = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const scale = SIZES[size] / BASE.size;

  useEffect(() => {
    progress.setValue(0);
    const loop = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: motionDuration.loaderCycle,
        easing: Easing.linear,
        useNativeDriver: NATIVE_DRIVER,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const motion = useMemo(
    () => ({
      coreScale: buildInterpolation(progress, CORE_SCALE, calmEase),
      coreOpacity: buildInterpolation(progress, CORE_OPACITY, calmEase),
      softOpacity: buildInterpolation(progress, SOFT_PULSE, Easing.inOut(Easing.ease)),
      wave1Scale: buildInterpolation(progress, WAVE_SCALE, waveEase),
      wave1Opacity: buildInterpolation(progress, WAVE_OPACITY, waveEase),
      wave2Scale: buildInterpolation(progress, WAVE_SCALE, waveEase, WAVE_DELAY),
      wave2Opacity: buildInterpolation(progress, WAVE_OPACITY, waveEase, WAVE_DELAY),
    }),
    [progress],
  );

  const core = BASE.core * scale;
  const haloBox = (BASE.core + BASE.halo * 2) * scale;
  const ring = {
    width: core,
    height: core,
    borderRadius: core / 2,
    borderWidth: BASE.ring * scale,
  };

  return (
    <View
      role="status"
      aria-label="Cargando"
      accessibilityLabel="Cargando"
      style={[styles.root, style]}
    >
      <View style={[styles.stage, { width: SIZES[size], height: SIZES[size] }]}>
        {reduceMotion ? null : (
          <>
            <Animated.View
              style={[
                styles.wave,
                ring,
                { opacity: motion.wave1Opacity, transform: [{ scale: motion.wave1Scale }] },
              ]}
            />
            <Animated.View
              style={[
                styles.wave,
                ring,
                { opacity: motion.wave2Opacity, transform: [{ scale: motion.wave2Scale }] },
              ]}
            />
          </>
        )}
        <Animated.View
          style={[
            styles.halo,
            { width: haloBox, height: haloBox, borderRadius: haloBox / 2 },
            reduceMotion
              ? { opacity: motion.softOpacity }
              : { opacity: motion.coreOpacity, transform: [{ scale: motion.coreScale }] },
          ]}
        >
          <View style={{ width: core, height: core, borderRadius: core / 2, backgroundColor: COLOR }} />
        </Animated.View>
      </View>
      {text ? <Text style={styles.text}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  // Los hijos absolutos quedan centrados por el alineado del escenario.
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: {
    position: 'absolute',
    borderColor: COLOR,
  },
  halo: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: HALO,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: TEXT_COLOR,
    textAlign: 'center',
    fontFamily: font.semiBold,
  },
});
