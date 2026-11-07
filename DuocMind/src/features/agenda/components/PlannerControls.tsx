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
import { Reveal } from '@/shared/motion/Reveal';
import { scheduleStyles as s } from '../screens/ScheduleScreen.styles';
export function PlannerButton(
  { label, a11yLabel, onPress, secondary = false, danger = false, disabled = false, selected }: {
    label: string;
    a11yLabel?: string;
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
      accessibilityLabel={a11yLabel ?? label}
      aria-pressed={selected}
      accessibilityState={{ disabled, selected }}
    >
      <Text style={[s.buttonText, secondary && s.secondaryText, danger && s.dangerText]}>
        {label}
      </Text>
    </ScalePress>
  );
}
export function PlannerSegmented<T extends string>({ options, value, onChange }: {
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={s.segmented}>
      {options.map(([option, label]) => (
        <ScalePress
          key={option}
          style={[s.segment, value === option && s.segmentSelected]}
          onPress={() => onChange(option)}
          accessibilityRole='button'
          accessibilityLabel={label}
          aria-pressed={value === option}
          accessibilityState={{ selected: value === option }}
        >
          <Text style={[s.segmentText, value === option && s.segmentTextSelected]}>{label}</Text>
        </ScalePress>
      ))}
    </View>
  );
}
export function PlannerChip({ label, selected = false, onPress }: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <ScalePress
      style={[s.chip, selected && s.chipSelected]}
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={label}
      aria-pressed={selected}
      accessibilityState={{ selected }}
    >
      <Text style={[s.chipText, selected && s.chipTextSelected]}>{label}</Text>
    </ScalePress>
  );
}
export function PlannerField(
  { label, value, onChangeText, placeholder, maxLength = 120, prominent = false }: {
    label: string;
    value: string;
    onChangeText: (value: string) => void;
    placeholder?: string;
    maxLength?: number;
    prominent?: boolean;
  },
) {
  return (
    <View style={s.field}>
      {!prominent && <Text style={s.label}>{label}</Text>}
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor='#8a8272'
        maxLength={maxLength}
        style={[s.input, prominent && s.inputProminent]}
        autoCapitalize='sentences'
      />
    </View>
  );
}
export function PlannerModal(
  { title, onClose, busy, children, footer, sheet = false }: PropsWithChildren<
    { title: string; onClose: () => void; busy: boolean; footer?: ReactNode; sheet?: boolean }
  >,
) {
  const content = (
    <ScrollView keyboardShouldPersistTaps='handled' contentContainerStyle={s.form}>
      {children}
    </ScrollView>
  );
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
        style={[s.backdrop, sheet && s.sheetBackdrop]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {sheet
          ? (
            <Reveal style={s.sheet}>
              <View style={s.sheetGrabber} />
              <View style={s.sheetHeader}>
                <Text style={s.sheetTitle} accessibilityRole='header'>{title}</Text>
                <ScalePress
                  style={s.linkAction}
                  onPress={onClose}
                  disabled={busy}
                  accessibilityRole='button'
                  accessibilityLabel='Cancelar'
                >
                  <Text style={s.linkActionText}>Cancelar</Text>
                </ScalePress>
              </View>
              {content}
              {footer}
            </Reveal>
          )
          : (
            <View style={s.modal}>
              <Text style={s.cardTitle} accessibilityRole='header'>{title}</Text>
              {content}
              {footer}
              <PlannerButton label='Cancelar' onPress={onClose} secondary disabled={busy} />
            </View>
          )}
      </KeyboardAvoidingView>
    </Modal>
  );
}
