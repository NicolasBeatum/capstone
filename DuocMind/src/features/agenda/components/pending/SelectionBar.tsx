import { Text, View } from 'react-native';
import { ScalePress } from '@/shared/components/ScalePress';
import { pendingStyles as s } from '../../screens/PendingScreen.styles';

/** Barra fija sobre la navegación mientras se seleccionan varias actividades. */
export function SelectionBar({ count, onCopy, onMove, onCancel }: {
  count: number;
  onCopy: () => void;
  onMove: () => void;
  onCancel: () => void;
}) {
  const empty = count === 0;
  const button = (label: string, onPress: () => void, disabled = false) => (
    <ScalePress
      style={[s.barButton, disabled && s.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole='button'
      accessibilityState={{ disabled }}
    >
      <Text style={s.barButtonText}>{label}</Text>
    </ScalePress>
  );
  return (
    <View style={s.bar}>
      <Text style={s.barText} accessibilityLiveRegion='polite'>
        {count} {count === 1 ? 'seleccionada' : 'seleccionadas'}
      </Text>
      {button('Copiar', onCopy, empty)}
      {button('Mover', onMove, empty)}
      {button('Cancelar', onCancel)}
    </View>
  );
}
