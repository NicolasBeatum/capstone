import React from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { warmPalette } from '@/shared/theme/warmPalette';
import { styles } from '../screens/registerForm.styles';

interface RegisterTextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Ícono a la izquierda del texto. */
  icon: React.ReactNode;
  /** Mensaje bajo el campo; también pinta el borde de error. */
  error?: string | null;
  /** Elemento a la derecha, por ejemplo el botón de mostrar contraseña. */
  trailing?: React.ReactNode;
}

/** Campo de texto del registro: etiqueta, ícono, borde de error y mensaje bajo el input. */
export function RegisterTextField({ label, icon, error, trailing, ...input }: RegisterTextFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, error ? styles.inputError : null]}>
        {icon}
        <TextInput
          style={styles.input}
          placeholderTextColor={warmPalette.placeholder}
          accessibilityLabel={label}
          {...input}
        />
        {trailing}
      </View>
      {error ? (
        <Text style={styles.fieldError} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
