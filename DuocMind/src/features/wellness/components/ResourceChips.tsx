import React from 'react';
import { ScrollView, Text } from 'react-native';
import { ScalePress } from '@/shared/components/ScalePress';
import type { ResourceCategory } from '../domain/wellnessResource';
import { resourceStyles as styles } from './resourceStyles';

interface ResourceChipsProps {
  categories: ResourceCategory[];
  /** null = «Todos». */
  selectedId: number | null;
  onSelect: (categoryId: number | null) => void;
}

interface ChipProps {
  label: string;
  accessibilityLabel: string;
  selected: boolean;
  onPress: () => void;
}

/* El chip elegido se distingue por fondo, borde y peso de la letra, no solo por el color. */
function Chip({ label, accessibilityLabel, selected, onPress }: ChipProps) {
  return (
    <ScalePress
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      // En web, accessibilityState no llega al DOM; aria-selected sirve en web y en nativo.
      aria-selected={selected}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </ScalePress>
  );
}

/** Fila de chips: «Todos» y una categoría por cada una con recursos. */
export function ResourceChips({ categories, selectedId, onSelect }: ResourceChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsContent}
    >
      <Chip
        label="Todos"
        accessibilityLabel="Todas las categorías"
        selected={selectedId === null}
        onPress={() => onSelect(null)}
      />
      {categories.map((category) => (
        <Chip
          key={category.id}
          label={category.name}
          accessibilityLabel={`Categoría ${category.name}`}
          selected={selectedId === category.id}
          onPress={() => onSelect(category.id)}
        />
      ))}
    </ScrollView>
  );
}
