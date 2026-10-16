import React, { useId } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { DancingBrote } from '@/shared/components/DancingBrote';
import { CheckIcon, LeafIcon } from '@/shared/components/Icons';
import { fontFamily as font } from '@/shared/theme/typography';

interface StudentCredentialProps {
  firstName: string;
  lastName: string;
  /** RUT ya formateado como ##.###.###-#. */
  rut: string;
  /** Los tres datos están completos y listos para guardar. */
  ready: boolean;
  /** Cuántos de los tres datos están completos; alegra al Brote a medida que sube. */
  filled: number;
}

/**
 * Credencial que se llena con lo que la persona escribe: muestra cómo quedará su
 * perfil antes de guardarlo. Mientras falta un dato, deja su lugar en tono tenue.
 */
export function StudentCredential({ firstName, lastName, rut, ready, filled }: StudentCredentialProps) {
  const orbId = `credentialOrb${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={
        fullName
          ? `Credencial de estudiante de ${fullName}${rut ? `, RUT ${rut}` : ''}`
          : 'Credencial de estudiante, aún sin datos'
      }
    >
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
        <Defs>
          <RadialGradient id={orbId} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="rgba(249, 221, 133, 0.34)" />
            <Stop offset="1" stopColor="rgba(249, 221, 133, 0)" />
          </RadialGradient>
        </Defs>
        <Circle cx="100%" cy="0%" r="170" fill={`url(#${orbId})`} />
      </Svg>
      <View style={styles.sheen} pointerEvents="none" />

      <DancingBrote t={BROTE_MOOD_BASE + filled * BROTE_MOOD_STEP} size={BROTE_SIZE} style={styles.brote} />

      <View style={styles.topRow}>
        <View style={styles.brand}>
          <LeafIcon size={16} color="#f9dd85" />
          <Text style={styles.brandText}>DuocMind</Text>
        </View>
        <Text style={styles.role}>Estudiante</Text>
      </View>

      <View style={styles.names}>
        <Text
          style={[styles.name, !firstName && styles.placeholder]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {firstName.trim() || 'Tu nombre'}
        </Text>
        <Text
          style={[styles.name, !lastName && styles.placeholder]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          {lastName.trim() || 'Tu apellido'}
        </Text>
      </View>

      <View style={styles.bottomRow}>
        <Text style={[styles.rut, !rut && styles.placeholder]} numberOfLines={1}>
          {rut || '00.000.000-0'}
        </Text>
        <View style={[styles.status, ready && styles.statusReady]}>
          {ready ? <CheckIcon size={11} color="#1a2b44" /> : <View style={styles.statusDot} />}
          <Text style={[styles.statusText, ready && styles.statusTextReady]}>
            {ready ? 'Lista para guardar' : 'Faltan datos'}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * El Brote siempre muestra ojos felices cerrados (desde t = 0.88): en ánimos menores los
 * ojos de punto se funden con los cerrados y se ven raros. Con cada dato la flor se abre más.
 */
const BROTE_MOOD_BASE = 0.9;
const BROTE_MOOD_STEP = 0.1 / 3;
const BROTE_SIZE = 84;

const cream = '#f3ecda';
const gold = '#f9dd85';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a2b44',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(249, 221, 133, 0.28)',
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 18,
    shadowColor: '#1a2b44',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 6,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 22,
    right: 22,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: 'rgba(249, 221, 133, 0.55)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandText: {
    fontSize: 13,
    color: cream,
    fontFamily: font.extraBold,
  },
  role: {
    fontSize: 11,
    color: gold,
    fontFamily: font.semiBold,
    borderWidth: 1,
    borderColor: 'rgba(249, 221, 133, 0.45)',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  brote: {
    position: 'absolute',
    right: 12,
    bottom: 46,
  },
  names: {
    marginTop: 26,
    // Deja libre la esquina donde baila el Brote.
    paddingRight: BROTE_SIZE + 4,
    marginBottom: 22,
  },
  name: {
    fontSize: 28,
    lineHeight: 34,
    color: cream,
    fontFamily: font.extraBold,
  },
  placeholder: {
    color: 'rgba(243, 236, 218, 0.28)',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rut: {
    flexShrink: 1,
    fontSize: 15,
    letterSpacing: 0.6,
    color: cream,
    fontFamily: font.bold,
    fontVariant: ['tabular-nums'],
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(243, 236, 218, 0.1)',
  },
  statusReady: {
    backgroundColor: gold,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: gold,
  },
  statusText: {
    fontSize: 11,
    color: cream,
    fontFamily: font.semiBold,
  },
  statusTextReady: {
    color: '#1a2b44',
    fontFamily: font.bold,
  },
});
