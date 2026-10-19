import React, { useMemo, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  PanResponder,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface SwipeToDismissProps {
  children: React.ReactNode;
  onDismiss: () => void;
  style?: StyleProp<ViewStyle>;
}

/* Fracción del ancho o velocidad a partir de la cual el gesto descarta el elemento */
const DISMISS_RATIO = 0.35;
const DISMISS_VELOCITY = 0.8;

/**
 * Descarta su contenido al deslizarlo a la izquierda o derecha (dedo o mouse).
 * Un toque corto no se captura, así el botón interior sigue funcionando.
 */
export function SwipeToDismiss({ children, onDismiss, style }: SwipeToDismissProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const width = useRef(0);
  // Ref para no recrear el PanResponder (y cortar el gesto) cuando el padre re-renderiza.
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const responder = useMemo(() => {
    const isHorizontalDrag = (dx: number, dy: number) => Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.5;

    return PanResponder.create({
      onMoveShouldSetPanResponder: (_event, { dx, dy }) => isHorizontalDrag(dx, dy),
      // Captura para quitarle el gesto al Pressable interior cuando el movimiento es horizontal.
      onMoveShouldSetPanResponderCapture: (_event, { dx, dy }) => isHorizontalDrag(dx, dy),
      onPanResponderMove: Animated.event([null, { dx: translateX }], { useNativeDriver: false }),
      onPanResponderRelease: (_event, { dx, vx }) => {
        const passed = Math.abs(dx) > width.current * DISMISS_RATIO || Math.abs(vx) > DISMISS_VELOCITY;
        if (!passed) {
          Animated.spring(translateX, { toValue: 0, bounciness: 0, useNativeDriver: false }).start();
          return;
        }
        const direction = dx === 0 ? Math.sign(vx) || 1 : Math.sign(dx);
        Animated.timing(translateX, {
          toValue: direction * (width.current + 40),
          duration: 180,
          useNativeDriver: false,
        }).start(() => {
          AccessibilityInfo.announceForAccessibility('Notificación eliminada');
          onDismissRef.current();
        });
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: false }).start();
      },
    });
  }, [translateX]);

  const onLayout = (event: LayoutChangeEvent) => {
    width.current = event.nativeEvent.layout.width;
  };

  const opacity = translateX.interpolate({
    inputRange: [-240, 0, 240],
    outputRange: [0.2, 1, 0.2],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      {...responder.panHandlers}
      onLayout={onLayout}
      style={[style, { opacity, transform: [{ translateX }] }]}
      accessibilityActions={[{ name: 'dismiss', label: 'Eliminar' }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'dismiss') onDismiss();
      }}
    >
      {children}
    </Animated.View>
  );
}
