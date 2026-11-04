import React from 'react';
import {
  Platform,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

interface AuthActionButtonProps {
  label: string;
  busyLabel: string;
  isBusy: boolean;
  onPress: () => void;
  style: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
  arrowStyle: StyleProp<TextStyle>;
  /** Botón apagado e inactivo, por ejemplo mientras faltan datos o un consentimiento obligatorio. */
  disabled?: boolean;
  /** Estilo extra que se aplica solo cuando está deshabilitado. */
  disabledStyle?: StyleProp<ViewStyle>;
  /** Etiqueta de accesibilidad; por defecto se lee el texto del botón. */
  accessibilityLabel?: string;
}

export function AuthActionButton({
  label,
  busyLabel,
  isBusy,
  onPress,
  style,
  textStyle,
  arrowStyle,
  disabled = false,
  disabledStyle,
  accessibilityLabel,
}: AuthActionButtonProps) {
  const inactive = isBusy || disabled;

  if (Platform.OS === 'web') {
    return (
      <View style={[style, disabled && disabledStyle]}>
        <button
          type="button"
          disabled={inactive}
          aria-label={accessibilityLabel}
          onClick={() => onPress()}
          style={{ ...webButtonStyle, cursor: inactive ? 'default' : 'pointer' }}
        >
          <Text style={textStyle}>{isBusy ? busyLabel : label}</Text>
          {!isBusy && <Text style={arrowStyle}>→</Text>}
        </button>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[style, disabled && disabledStyle]}
      onPress={onPress}
      disabled={inactive}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: inactive, busy: isBusy }}
    >
      <Text style={textStyle}>{isBusy ? busyLabel : label}</Text>
      {!isBusy && <Text style={arrowStyle}>→</Text>}
    </TouchableOpacity>
  );
}

const webButtonStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  padding: 0,
  border: 0,
  background: 'transparent',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'inherit',
};
