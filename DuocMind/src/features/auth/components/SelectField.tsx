import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ScalePress } from '@/shared/components/ScalePress';
import type { SelectOption } from '../domain/registration';
import { styles } from './SelectField.styles';

interface SelectFieldProps {
  label: string;
  placeholder: string;
  options: SelectOption[];
  /** `key` de la opción elegida, o null si aún no se elige. */
  value: string | null;
  onChange: (key: string) => void;
  disabled?: boolean;
  /** Texto bajo el campo cuando está deshabilitado o no hay opciones. */
  hint?: string;
}

/** Selector entre opciones fijas: la persona elige de una lista, nunca escribe. */
export function SelectField({ label, placeholder, options, value, onChange, disabled = false, hint }: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.key === value);
  const isOpen = open && !disabled;

  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <ScalePress
        style={[styles.trigger, disabled && styles.triggerDisabled]}
        onPress={() => setOpen(!isOpen)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected ? selected.label : placeholder}`}
        accessibilityState={{ disabled, expanded: isOpen }}
      >
        <Text style={[styles.triggerText, !selected && styles.placeholder]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.chevron}>{isOpen ? '▴' : '▾'}</Text>
      </ScalePress>

      {isOpen ? (
        <View style={styles.list}>
          <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.listScroll}>
            {options.map((option) => {
              const active = option.key === value;
              return (
                <ScalePress
                  key={option.key}
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => {
                    onChange(option.key);
                    setOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{option.label}</Text>
                  {active ? <Text style={styles.optionCheck}>✓</Text> : null}
                </ScalePress>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}
