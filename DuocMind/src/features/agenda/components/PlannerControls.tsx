import type { PropsWithChildren, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ScalePress } from '@/shared/components/ScalePress';
import { scheduleStyles as s } from '../screens/ScheduleScreen.styles';
export function PlannerButton(
  { label, onPress, secondary = false, danger = false, disabled = false, selected }: {
    label: string;
    onPress: () => void;
    secondary?: boolean;
    danger?: boolean;
    disabled?: boolean;
    selected?: boolean;
  },
) {
  return (
    <ScalePress
      style={[s.button, secondary && s.secondary, danger && s.danger, disabled && s.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole='button'
      accessibilityLabel={label}
      aria-pressed={selected}
      accessibilityState={{ disabled, selected }}
    >
      <Text style={[s.buttonText, secondary && s.secondaryText, danger && s.dangerText]}>
        {label}
      </Text>
    </ScalePress>
  );
}
export function PlannerField(
  { label, value, onChangeText, placeholder, maxLength = 120 }: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder?: string;
    maxLength?: number;
  },
) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor='#8a8272'
        maxLength={maxLength}
        style={s.input}
        autoCapitalize='sentences'
      />
    </View>
  );
}
export function PlannerModal(
  { title, onClose, busy, children, footer }: PropsWithChildren<
    { title: string; onClose: () => void; busy: boolean; footer?: ReactNode }
  >,
) {
  return (
    <Modal
      visible
      transparent
      animationType='none'
      onRequestClose={() => {
        if (!busy) onClose();
      }}
    >
      <KeyboardAvoidingView
        style={s.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={s.modal}>
          <Text style={s.cardTitle} accessibilityRole='header'>{title}</Text>
          <ScrollView keyboardShouldPersistTaps='handled' contentContainerStyle={s.form}>
            {children}
          </ScrollView>
          {footer}
          <PlannerButton label='Cancelar' onPress={onClose} secondary disabled={busy} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
