import React from 'react';
import { Text, View } from 'react-native';
import { CheckIcon } from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import { warmPalette } from '@/shared/theme/warmPalette';
import { styles } from '../screens/registerForm.styles';

interface ConsentCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label: string;
  /** Etiqueta pequeña sobre la casilla; también se anuncia en voz alta. */
  requirement: 'Obligatorio' | 'Opcional';
  /** Abre la explicación de lo que se comparte; si falta, no se muestra el enlace. */
  onInfo?: () => void;
}

/** Casilla del registro con su etiqueta «Obligatorio» u «Opcional». */
export function ConsentCheckbox({ checked, onToggle, label, requirement, onInfo }: ConsentCheckboxProps) {
  const required = requirement === 'Obligatorio';
  return (
    <View>
      <ScalePress
        style={styles.consent}
        onPress={onToggle}
        accessibilityRole="checkbox"
        accessibilityLabel={`${requirement}: ${label}`}
        accessibilityState={{ checked }}
      >
        <View style={[styles.tag, required ? styles.tagRequired : styles.tagOptional]}>
          <Text style={[styles.tagText, required ? styles.tagTextRequired : styles.tagTextOptional]}>
            {requirement}
          </Text>
        </View>
        <View style={styles.consentRow}>
          <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
            {checked ? <CheckIcon size={20} color={warmPalette.white} /> : null}
          </View>
          <Text style={styles.consentText}>{label}</Text>
        </View>
      </ScalePress>
      {/* Fuera de la casilla: tocar el enlace no debe marcarla. */}
      {onInfo ? (
        <ScalePress
          style={styles.consentInfo}
          onPress={onInfo}
          accessibilityRole="button"
          accessibilityLabel={`Qué se comparte: ${label}`}
        >
          <Text style={styles.consentInfoText}>¿Qué se comparte?</Text>
        </ScalePress>
      ) : null}
    </View>
  );
}
