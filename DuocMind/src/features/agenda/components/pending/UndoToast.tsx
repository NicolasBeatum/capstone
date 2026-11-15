import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { ScalePress } from '@/shared/components/ScalePress';
import { pendingStyles as s } from '../../screens/PendingScreen.styles';

/** Tiempo que queda disponible «Deshacer» después de marcar o desmarcar. */
export const UNDO_WINDOW_MS = 5000;

/** Aviso breve sobre la navegación; se oculta solo y su temporizador se limpia al cambiar. */
export function UndoToast({ message, disabled, onUndo, onHide }: {
  message: string;
  disabled: boolean;
  onUndo: () => void;
  onHide: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onHide, UNDO_WINDOW_MS);
    return () => clearTimeout(timer);
  }, [message, onHide]);
  return (
    <View style={s.bar} accessibilityLiveRegion='polite'>
      <Text style={s.barText} accessibilityRole='alert'>{message}</Text>
      <ScalePress
        style={[s.barButton, disabled && s.disabled]}
        onPress={onUndo}
        disabled={disabled}
        accessibilityRole='button'
        accessibilityState={{ disabled }}
      >
        <Text style={s.barButtonText}>Deshacer</Text>
      </ScalePress>
    </View>
  );
}
