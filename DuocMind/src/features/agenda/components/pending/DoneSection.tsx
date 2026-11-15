import { type ReactNode, useState } from 'react';
import { Text, View } from 'react-native';
import { ChevronDownIcon, ChevronRightIcon } from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import type { PendingItem } from '../../domain/pendingActivities';
import { pendingColors, pendingStyles as s } from '../../screens/PendingScreen.styles';
import { CappedList } from './PendingGroup';

/** «Hechas · N», plegada al abrir la pantalla y con tope de 20 filas. */
export function DoneSection({ items, renderRow }: {
  items: PendingItem[];
  renderRow: (item: PendingItem, index: number) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;
  const Chevron = open ? ChevronDownIcon : ChevronRightIcon;
  return (
    <View style={s.group}>
      <ScalePress
        style={s.doneToggle}
        onPress={() => setOpen(!open)}
        accessibilityRole='button'
        accessibilityLabel={`Hechas, ${items.length}`}
        aria-expanded={open}
        accessibilityState={{ expanded: open }}
      >
        <Chevron size={14} color={pendingColors.muted} />
        <Text style={s.doneToggleText}>HECHAS · {items.length}</Text>
      </ScalePress>
      {open && <CappedList items={items} limit={20} style={s.doneCard} renderRow={renderRow} />}
    </View>
  );
}
