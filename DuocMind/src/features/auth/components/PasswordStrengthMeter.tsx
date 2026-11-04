import React from 'react';
import { Text, View } from 'react-native';
import { CheckIcon } from '@/shared/components/Icons';
import { warmPalette } from '@/shared/theme/warmPalette';
import { passwordRequirements, passwordStrength, type StrengthLevel } from '../domain/registerForm';
import { styles } from '../screens/registerForm.styles';

const LEVEL_COLORS: Record<StrengthLevel, { bar: string; text: string }> = {
  weak: { bar: '#C0645A', text: warmPalette.error },
  progress: { bar: warmPalette.gold, text: warmPalette.goldText },
  almost: { bar: warmPalette.gold, text: warmPalette.goldText },
  strong: { bar: warmPalette.success, text: '#1F6B52' },
};

/**
 * Indicador de seguridad: 4 tramos que se llenan según los requisitos cumplidos, la etiqueta del
 * estado y la lista de requisitos con check. El estado nunca depende solo del color.
 */
export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = passwordStrength(password);
  const requirements = passwordRequirements(password);
  const colors = LEVEL_COLORS[strength.level];
  // Sin nada escrito el estado «Débil» no se pinta de alerta.
  const statusColor = password.length === 0 ? warmPalette.textSecondary : colors.text;

  return (
    <View style={styles.strength}>
      <View
        accessible
        accessibilityLabel={`Seguridad de la contraseña: ${strength.label}. ${strength.metCount} de ${strength.total} requisitos cumplidos.`}
      >
        <View style={styles.strengthHeader}>
          <Text style={styles.strengthLabel}>Seguridad</Text>
          <Text style={[styles.strengthStatus, { color: statusColor }]}>{strength.label}</Text>
        </View>
        <View style={styles.strengthBars}>
          {Array.from({ length: strength.total }, (_, index) => (
            <View
              key={index}
              style={[styles.strengthBar, index < strength.metCount && { backgroundColor: colors.bar }]}
            />
          ))}
        </View>
      </View>

      <View style={styles.requirements}>
        {requirements.map((requirement) => (
          <View
            key={requirement.id}
            style={styles.requirement}
            accessible
            accessibilityLabel={`${requirement.label}: ${requirement.met ? 'cumplido' : 'pendiente'}`}
          >
            <View style={[styles.requirementDot, requirement.met && styles.requirementDotMet]}>
              {requirement.met ? <CheckIcon size={12} color={warmPalette.white} /> : null}
            </View>
            <Text style={[styles.requirementText, requirement.met && styles.requirementTextMet]}>
              {requirement.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
