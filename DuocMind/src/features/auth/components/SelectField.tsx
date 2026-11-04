import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { CheckIcon, ChevronDownIcon } from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import { warmPalette } from '@/shared/theme/warmPalette';
import type { SelectOption } from '../domain/registration';
import { styles } from './SelectField.styles';

interface SelectFieldProps {
  label: string;
  placeholder: string;
  options: SelectOption[];
  /** `key` de la opción elegida, o null si aún no se elige. */
  value: string | null;
  onChange: (key: string) => void;
  /** Ícono a la izquierda del texto. */
  icon: React.ReactNode;
  disabled?: boolean;
  /** Texto bajo el campo cuando está deshabilitado o no hay opciones. */
  hint?: string;
}

/** Selector entre opciones fijas: la persona elige de una lista, nunca escribe. */
export function SelectField({ label, placeholder, options, value, onChange, icon, disabled = false, hint }: SelectFieldProps) {
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
        {icon}
        <Text style={[styles.triggerText, !selected && styles.placeholder]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <View style={isOpen ? styles.chevronOpen : undefined}>
          <ChevronDownIcon size={20} color={warmPalette.textSecondary} />
        </View>
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
                  {active ? <CheckIcon size={18} color={warmPalette.navy} /> : null}
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
