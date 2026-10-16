import React, { useEffect, useRef } from 'react';
import { Animated, Modal, Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { glassTokens } from '@/shared/components/Glass';
import { CheckIcon, MailIcon } from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import {
  motionDistance,
  motionDuration,
  motionEasing,
  NATIVE_DRIVER,
} from '@/shared/motion/motionTokens';
import { useReducedMotion } from '@/shared/motion/useReducedMotion';
import { fontFamily as font } from '@/shared/theme/typography';

interface EmailConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
}

/* backdropFilter solo existe en web; en Android el vidrio se simula con la superficie translúcida */
const webBlur = (amount: number): ViewStyle =>
  Platform.OS === 'web' ? ({ backdropFilter: `blur(${amount}px)` } as ViewStyle) : {};

/**
 * Aviso que se muestra en el login tras registrarse: indica que se envió el correo de
 * confirmación y que hay que activar la cuenta antes de iniciar sesión.
 * La tarjeta entra con fundido y ascenso; un halo respira detrás del sobre.
 */
export function EmailConfirmationModal({ visible, onClose }: EmailConfirmationModalProps) {
  const reduceMotion = useReducedMotion();
  const card = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    if (reduceMotion) {
      card.setValue(1);
      halo.setValue(0);
      return;
    }

    card.setValue(0);
    const entrance = Animated.timing(card, {
      toValue: 1,
      duration: motionDuration.reveal,
      easing: motionEasing.calm,
      useNativeDriver: NATIVE_DRIVER,
    });
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(halo, {
          toValue: 1,
          duration: motionDuration.haloPulse,
          easing: motionEasing.breath,
          useNativeDriver: NATIVE_DRIVER,
        }),
        Animated.timing(halo, {
          toValue: 0,
          duration: motionDuration.haloPulse,
          easing: motionEasing.breath,
          useNativeDriver: NATIVE_DRIVER,
        }),
      ]),
    );
    entrance.start();
    pulse.start();

    return () => {
      entrance.stop();
      pulse.stop();
    };
  }, [visible, reduceMotion, card, halo]);

  const cardStyle = {
    opacity: card,
    transform: [
      {
        translateY: card.interpolate({
          inputRange: [0, 1],
          outputRange: [motionDistance.rise, 0],
        }),
      },
    ],
  };
  const haloStyle = {
    opacity: halo.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.15] }),
    transform: [
      {
        scale: halo.interpolate({ inputRange: [0, 1], outputRange: [1, motionDistance.haloScale] }),
      },
    ],
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, webBlur(10)]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Cerrar aviso"
      />
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          style={[styles.card, webBlur(24), cardStyle]}
          accessibilityViewIsModal
          accessibilityRole="alert"
          accessibilityLabel="Te enviamos un correo de confirmación. Activa tu cuenta y luego inicia sesión."
        >
          <View style={styles.sheen} pointerEvents="none" />

          <View style={styles.iconWrap}>
            <Animated.View style={[styles.halo, haloStyle]} />
            <View style={styles.iconBadge}>
              <MailIcon size={30} color="#256b4a" />
              <View style={styles.check}>
                <CheckIcon size={11} color="#ffffff" />
              </View>
            </View>
          </View>

          <Text style={styles.eyebrow}>CUENTA CREADA</Text>
          <Text style={styles.title}>Revisa tu correo</Text>
          <Text style={styles.message}>
            Te enviamos un correo de confirmación. Activa tu cuenta desde el enlace y luego inicia
            sesión.
          </Text>

          <ScalePress style={styles.button} onPress={onClose} accessibilityRole="button">
            <Text style={styles.buttonText}>Entendido</Text>
          </ScalePress>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(26, 43, 68, 0.28)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'web' ? glassTokens.surface : 'rgba(255, 252, 244, 0.94)',
    borderWidth: 1,
    borderColor: glassTokens.border,
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    ...glassTokens.shadow,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 22,
    right: 22,
    height: 2,
    borderRadius: 1,
    backgroundColor: glassTokens.sheen,
  },
  iconWrap: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  halo: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(79, 138, 98, 0.35)',
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(226, 244, 233, 0.9)',
    borderWidth: 1,
    borderColor: glassTokens.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4f8a62',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.2,
    color: '#256b4a',
    fontFamily: font.bold,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    color: '#1a2b44',
    textAlign: 'center',
    fontFamily: font.bold,
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    lineHeight: 21,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    width: '100%',
    backgroundColor: '#1a2b44',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: font.bold,
  },
});
