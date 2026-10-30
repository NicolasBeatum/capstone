import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../screens/authForm.styles';

interface ConsentCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  /** Texto de la casilla; puede contener un enlace anidado. */
  children: React.ReactNode;
  accessibilityLabel: string;
}

/** Casilla con el estilo de la de términos, para consentimientos de privacidad. */
export function ConsentCheckbox({ checked, onToggle, children, accessibilityLabel }: ConsentCheckboxProps) {
  return (
    <TouchableOpacity
      style={styles.termsRow}
      onPress={onToggle}
      activeOpacity={0.8}
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked }}
    >
      <View style={[styles.checkbox, checked && styles.checkboxActive]}>
        {checked && <Text style={styles.checkboxCheck}>✓</Text>}
      </View>
      <Text style={styles.termsText}>{children}</Text>
    </TouchableOpacity>
  );
}
