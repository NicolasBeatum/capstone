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
}

export function AuthActionButton({
  label,
  busyLabel,
  isBusy,
  onPress,
  style,
  textStyle,
  arrowStyle,
}: AuthActionButtonProps) {
  if (Platform.OS === 'web') {
    return (
      <View style={style}>
        <button
          type="button"
          disabled={isBusy}
          onClick={() => onPress()}
          style={webButtonStyle}
        >
          <Text style={textStyle}>{isBusy ? busyLabel : label}</Text>
          {!isBusy && <Text style={arrowStyle}>→</Text>}
        </button>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={style}
      onPress={onPress}
      disabled={isBusy}
      activeOpacity={0.85}
      accessibilityRole="button"
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
  cursor: 'pointer',
  fontFamily: 'inherit',
};
