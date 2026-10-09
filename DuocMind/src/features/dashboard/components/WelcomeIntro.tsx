import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { Brote } from '@/shared/components/Brote';
import { LiquidBackground } from '@/shared/components/Glass';
import {
  motionDistance,
  motionDuration,
  motionEasing,
  NATIVE_DRIVER,
} from '@/shared/motion/motionTokens';
import { useReducedMotion } from '@/shared/motion/useReducedMotion';

export interface GreetingTarget {
  x: number;
  y: number;
}

interface WelcomeIntroProps {
  greeting: string;
  /** Mismo estilo que el saludo del dashboard, para que el relevo no se note. */
  textStyle: StyleProp<TextStyle>;
  /** Posición del saludo del dashboard respecto de la pantalla; null si no se pudo medir. */
  measureTarget: () => Promise<GreetingTarget | null>;
  onDone: () => void;
}

const CREAM = '#f3ecda';
const BROTE_SIZE = 150;
/** El Brote de bienvenida siempre aparece en su mejor ánimo. */
const HAPPY = 1;

/** El baile dura toda la bienvenida, hasta que el Brote se desvanece en el viaje. */
const DANCE_DURATION = motionDuration.reveal + motionDuration.welcomeHold + motionDuration.welcomeFlight;
const DANCE_CYCLES = DANCE_DURATION / (motionDuration.danceStep * 2);
const SAMPLES_PER_CYCLE = 24;

/**
 * El driver nativo solo interpola linealmente, así que el vaivén se muestrea en
 * muchos puntos: la inclinación sigue un seno y la altura su cuadrado, que sube
 * en cada lado y baja suave al pasar por el centro.
 */
function buildDanceRanges() {
  const samples = Math.ceil(DANCE_CYCLES * SAMPLES_PER_CYCLE);
  const input: number[] = [];
  const tilt: string[] = [];
  const lift: number[] = [];
  for (let i = 0; i <= samples; i += 1) {
    const progress = i / samples;
    const wave = Math.sin(progress * DANCE_CYCLES * 2 * Math.PI);
    input.push(progress);
    tilt.push(`${wave * motionDistance.danceTilt}deg`);
    lift.push(-wave * wave * motionDistance.danceLift);
  }
  return { input, tilt, lift };
}

const DANCE = buildDanceRanges();

/**
 * Bienvenida tras iniciar sesión: el Brote baila y saluda en el centro, luego el
 * saludo viaja hasta su lugar en el dashboard y el fondo se disuelve para
 * mostrarlo. Con movimiento reducido solo aparece el saludo y se desvanece.
 */
export function WelcomeIntro({ greeting, textStyle, measureTarget, onDone }: WelcomeIntroProps) {
  const reduceMotion = useReducedMotion();
  const appear = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const dance = useRef(new Animated.Value(0)).current;
  const flight = useRef(new Animated.Value(0)).current;
  const backdrop = useRef(new Animated.Value(1)).current;
  const textLayout = useRef<GreetingTarget | null>(null);
  const [offset, setOffset] = useState<GreetingTarget | null>(null);
  // Sin destino medido, todo el saludo se desvanece en lugar de viajar.
  const [fadeAll, setFadeAll] = useState(reduceMotion);

  const latest = useRef({ measureTarget, onDone, reduceMotion });
  latest.current = { measureTarget, onDone, reduceMotion };

  useEffect(() => {
    let active = true;
    let running: Animated.CompositeAnimation | null = null;
    const play = (animation: Animated.CompositeAnimation, next?: () => void) => {
      running = animation;
      animation.start(({ finished }) => finished && active && next?.());
    };
    const dissolve = () =>
      play(
        Animated.timing(backdrop, {
          toValue: 0,
          duration: motionDuration.screen,
          easing: motionEasing.calm,
          useNativeDriver: NATIVE_DRIVER,
        }),
        () => latest.current.onDone(),
      );

    const reduce = latest.current.reduceMotion;
    // Una sola animación continua de principio a fin: un loop reiniciaría el valor
    // en cada vuelta y el baile daría un salto.
    const danceRun = Animated.timing(dance, {
      toValue: 1,
      duration: DANCE_DURATION,
      easing: Easing.linear,
      useNativeDriver: NATIVE_DRIVER,
    });
    if (!reduce) {
      danceRun.start();
      play(
        Animated.timing(appear, {
          toValue: 1,
          duration: motionDuration.reveal,
          easing: motionEasing.calm,
          useNativeDriver: NATIVE_DRIVER,
        }),
      );
    }

    const holdTimer = setTimeout(
      () => {
        if (reduce) {
          dissolve();
          return;
        }
        void latest.current.measureTarget().then((target) => {
          if (!active) return;
          const start = textLayout.current;
          if (!target || !start) {
            setFadeAll(true);
            dissolve();
            return;
          }
          setOffset({ x: target.x - start.x, y: target.y - start.y });
          play(
            Animated.timing(flight, {
              toValue: 1,
              duration: motionDuration.welcomeFlight,
              easing: motionEasing.calm,
              useNativeDriver: NATIVE_DRIVER,
            }),
            dissolve,
          );
        });
      },
      (reduce ? 0 : motionDuration.reveal) + motionDuration.welcomeHold,
    );

    return () => {
      active = false;
      clearTimeout(holdTimer);
      danceRun.stop();
      running?.stop();
    };
  }, [appear, backdrop, dance, flight]);

  const handleTextLayout = (event: LayoutChangeEvent) => {
    const { x, y } = event.nativeEvent.layout;
    textLayout.current = { x, y };
  };

  const danceStyle = reduceMotion
    ? null
    : {
        // El baile pivota en la base del macetero, como si se meciera en su sitio.
        transformOrigin: '50% 100%',
        opacity: flight.interpolate({ inputRange: [0, 0.6], outputRange: [1, 0], extrapolate: 'clamp' }),
        transform: [
          {
            translateY: dance.interpolate({ inputRange: DANCE.input, outputRange: DANCE.lift }),
          },
          {
            rotate: dance.interpolate({ inputRange: DANCE.input, outputRange: DANCE.tilt }),
          },
          { scale: flight.interpolate({ inputRange: [0, 1], outputRange: [1, 0.8] }) },
        ],
      };

  const textMotion = reduceMotion
    ? null
    : {
        transform: [
          { translateX: flight.interpolate({ inputRange: [0, 1], outputRange: [0, offset?.x ?? 0] }) },
          { translateY: flight.interpolate({ inputRange: [0, 1], outputRange: [0, offset?.y ?? 0] }) },
          {
            scale: flight.interpolate({
              inputRange: [0, 1],
              outputRange: [motionDistance.welcomeScale, 1],
            }),
          },
        ],
      };

  const rise = reduceMotion
    ? 0
    : appear.interpolate({ inputRange: [0, 1], outputRange: [motionDistance.rise, 0] });

  return (
    <Animated.View
      style={[styles.overlay, fadeAll ? { opacity: backdrop } : null]}
      accessibilityViewIsModal
    >
      <Animated.View style={[styles.backdrop, fadeAll ? null : { opacity: backdrop }]}>
        <LiquidBackground />
      </Animated.View>

      <Animated.View style={[styles.stage, { opacity: appear, transform: [{ translateY: rise }] }]}>
        <Animated.View style={danceStyle}>
          <Brote t={HAPPY} size={BROTE_SIZE} />
        </Animated.View>
        <Animated.Text
          onLayout={handleTextLayout}
          style={[textStyle, styles.greeting, textMotion]}
          numberOfLines={2}
          accessibilityLiveRegion="polite"
        >
          {greeting}
        </Animated.Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 60,
    elevation: 60,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: CREAM,
  },
  // El escenario ocupa toda la pantalla: así la posición medida del saludo es
  // relativa a la pantalla, igual que la del saludo del dashboard.
  stage: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  greeting: {
    marginTop: 18,
  },
});
