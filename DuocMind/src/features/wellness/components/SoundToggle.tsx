import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { fontFamily as font } from '@/shared/theme/typography';
import { resourceColors } from './resourceStyles';

const { navy, muted, border, ivory } = resourceColors;

interface Props {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

/** Interruptor del sonido de la respiración: visible junto al botón de acción. */
export function SoundToggle({ enabled, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.state}>{enabled ? 'Con sonido' : 'Sin sonido'}</Text>
        <Switch
          value={enabled}
          onValueChange={onChange}
          accessibilityRole="switch"
          accessibilityLabel="Sonido de la respiración"
          accessibilityState={{ checked: enabled }}
          trackColor={{ false: border, true: navy }}
          thumbColor={ivory}
        />
      </View>
      <Text style={styles.hint}>El sonido es opcional.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 18 },
  row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12 },
  state: { fontSize: 15, color: navy, fontFamily: font.extraBold },
  hint: { fontSize: 13, color: muted, fontFamily: font.semiBold },
});
