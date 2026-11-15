import { type ReactNode, useState } from 'react';
import { type StyleProp, Text, View, type ViewStyle } from 'react-native';
import { ScalePress } from '@/shared/components/ScalePress';
import { Reveal } from '@/shared/motion/Reveal';
import type { PendingGroup as Group, PendingItem } from '../../domain/pendingActivities';
import { pendingStyles as s } from '../../screens/PendingScreen.styles';

/** Tarjeta de filas con tope: muestra las primeras `limit` y un botón «Ver N más». */
export function CappedList({ items, limit, style, renderRow }: {
  items: PendingItem[];
  limit: number;
  style?: StyleProp<ViewStyle>;
  renderRow: (item: PendingItem, index: number) => ReactNode;
}) {
  const [open, setOpen] = useState(false), hidden = items.length - limit;
  const visible = open || hidden <= 0 ? items : items.slice(0, limit);
  return (
    <View style={[s.card, style]}>
      {visible.map(renderRow)}
      {hidden > 0 && (
        <ScalePress
          style={s.more}
          onPress={() => setOpen(!open)}
          accessibilityRole='button'
          aria-expanded={open}
          accessibilityState={{ expanded: open }}
        >
          <Text style={s.moreText}>{open ? 'Ver menos' : `Ver ${hidden} más`}</Text>
        </ScalePress>
      )}
    </View>
  );
}

const LIMITS: Record<Group['id'], number> = { late: 5, today: Infinity, soon: Infinity, later: Infinity };

export function PendingGroup({ group, index, renderRow }: {
  group: Group;
  index: number;
  renderRow: (item: PendingItem, index: number) => ReactNode;
}) {
  return (
    <Reveal index={index} style={s.group}>
      <Text
        style={[
          s.groupLabel,
          group.id === 'late' && s.groupLabelLate,
          group.id === 'later' && s.groupLabelLater,
        ]}
        accessibilityRole='header'
        accessibilityLabel={`${group.label}, ${group.items.length}`}
      >
        {group.label.toUpperCase()} · {group.items.length}
      </Text>
      <CappedList items={group.items} limit={LIMITS[group.id]} renderRow={renderRow} />
    </Reveal>
  );
}
