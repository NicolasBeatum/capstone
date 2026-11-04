import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../screens/registerForm.styles';

interface RegisterSectionProps {
  /** Número del paso, en el círculo navy. */
  step: number;
  title: string;
  children: React.ReactNode;
}

/** Tarjeta numerada de un bloque del registro. */
export function RegisterSection({ step, title, children }: RegisterSectionProps) {
  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionNumber} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={styles.sectionNumberText}>{step}</Text>
        </View>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}
