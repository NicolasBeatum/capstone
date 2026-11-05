import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { fontFamily as font } from '@/shared/theme/typography';

/* Bandera de Chile dibujada: el emoji de bandera no se ve en Windows ni en la web. */
export function ChileFlag({ width = 24, height = 16 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 30 20" accessibilityElementsHidden importantForAccessibility="no">
      <Rect width={30} height={20} rx={3} fill="#ffffff" />
      <Rect y={10} width={30} height={10} fill="#d52b1e" />
      <Rect width={10} height={10} fill="#0039a6" />
      <Path
        d="M5 1.8 L5.95 4.1 L8.4 4.25 L6.5 5.85 L7.1 8.2 L5 6.9 L2.9 8.2 L3.5 5.85 L1.6 4.25 L4.05 4.1 Z"
        fill="#ffffff"
      />
      <Rect width={30} height={20} rx={3} fill="none" stroke="rgba(26,43,68,0.18)" strokeWidth={1} />
    </Svg>
  );
}

/** Prefijo fijo del campo de teléfono: bandera de Chile y +56. */
export function ChilePhonePrefix() {
  return (
    <>
      <ChileFlag />
      <Text style={styles.code}>+56</Text>
    </>
  );
}

const styles = StyleSheet.create({
  code: {
    fontSize: 15,
    color: '#1a2b44',
    fontFamily: font.bold,
  },
});
