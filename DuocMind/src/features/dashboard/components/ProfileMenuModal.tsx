import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { glassTokens } from '@/shared/components/Glass';
import { ScalePress } from '@/shared/components/ScalePress';
import { motionDistance, motionDuration, motionEasing, NATIVE_DRIVER } from '@/shared/motion/motionTokens';
import { useReducedMotion } from '@/shared/motion/useReducedMotion';
import { fontFamily as font } from '@/shared/theme/typography';

/** Posición del avatar en la ventana, para desplegar el menú justo debajo. */
export interface MenuAnchor {
  top: number;
  right: number;
}

interface ProfileMenuModalProps {
  visible: boolean;
  anchor: MenuAnchor | null;
  /** Nombre completo mostrado en la cabecera; sin perfil queda un texto neutro. */
  name: string | null;
  signingOut: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

/** Menú que se despliega hacia abajo desde el avatar del dashboard. */
export function ProfileMenuModal({
  visible,
  anchor,
  name,
  signingOut,
  onClose,
  onSignOut,
}: ProfileMenuModalProps) {
  const reduceMotion = useReducedMotion();
  const panel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    if (reduceMotion) {
      panel.setValue(1);
      return;
    }
    panel.setValue(0);
    const animation = Animated.timing(panel, {
      toValue: 1,
      duration: motionDuration.pressOut,
      easing: motionEasing.soft,
      useNativeDriver: NATIVE_DRIVER,
    });
    animation.start();
    return () => animation.stop();
  }, [visible, reduceMotion, panel]);

  // El menú nace en la esquina del avatar y crece hacia abajo y a la izquierda.
  const panelStyle = {
    opacity: panel,
    transform: [
      {
        scale: panel.interpolate({
          inputRange: [0, 1],
          outputRange: [motionDistance.menuOpenScale, 1],
        }),
      },
    ],
  };

  return (
    <Modal
      visible={visible && anchor !== null}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Cerrar menú de perfil"
      />
      {anchor ? (
        <Animated.View
          style={[styles.panel, { top: anchor.top, right: anchor.right }, panelStyle]}
          accessibilityViewIsModal
        >
          <Text style={styles.name} numberOfLines={2}>
            {name ?? 'Tu perfil'}
          </Text>
          <View style={styles.divider} />
          <ScalePress
            style={[styles.signOut, signingOut && styles.signOutDisabled]}
            onPress={onSignOut}
            disabled={signingOut}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            accessibilityState={{ disabled: signingOut }}
          >
            <Text style={styles.signOutText}>{signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</Text>
          </ScalePress>
        </Animated.View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    width: 220,
    // Superficie sólida: el menú no deja ver el contenido de atrás.
    backgroundColor: '#fffcf4',
    borderWidth: 1,
    borderColor: '#eadfc4',
    borderRadius: 18,
    padding: 8,
    gap: 6,
    // Punto fijo de la animación: la esquina superior derecha, bajo el avatar.
    transformOrigin: 'top right',
    ...glassTokens.shadow,
  },
  name: {
    fontSize: 14,
    lineHeight: 19,
    color: '#1a2b44',
    fontFamily: font.bold,
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(26, 43, 68, 0.1)',
  },
  signOut: {
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  signOutDisabled: {
    opacity: 0.6,
  },
  signOutText: {
    fontSize: 14,
    color: '#a33a30',
    fontFamily: font.bold,
  },
});
