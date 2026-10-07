import React from 'react';
import { Platform, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './BottomNav.styles';
import { type Href, useRouter } from 'expo-router';
import { useTheme } from '@/shared/theme/theme';
import { ScalePress } from './ScalePress';
import {
  CalendarIcon,
  CheckSquareIcon,
  HomeIcon,
  PlusIcon,
  SproutIcon,
} from './Icons';

interface BottomNavProps {
  /** 'checkin' resalta el botón central */
  currentTab: 'home' | 'agenda' | 'checkin' | 'pending' | 'wellness';
}

type TabId = Exclude<BottomNavProps['currentTab'], 'checkin'>;

interface Tab {
  id: TabId;
  label: string;
  route: Href;
  a11y: string;
  Icon: (props: { size?: number; color?: string }) => React.ReactNode;
}

const LEFT_TABS: Tab[] = [
  { id: 'home', label: 'Inicio', route: '/dashboard', a11y: 'Ir al inicio', Icon: HomeIcon },
  { id: 'agenda', label: 'Agenda', route: '/agenda', a11y: 'Ir a la agenda', Icon: CalendarIcon },
];

const RIGHT_TABS: Tab[] = [
  { id: 'pending', label: 'Pendientes', route: '/pendientes', a11y: 'Ir a pendientes', Icon: CheckSquareIcon },
  { id: 'wellness', label: 'Bienestar', route: '/wellness', a11y: 'Ir al centro de bienestar', Icon: SproutIcon },
];

/* backdropFilter solo existe en web; en Android el vidrio se simula con la superficie translúcida */
const webBlur: ViewStyle =
  Platform.OS === 'web' ? ({ backdropFilter: 'blur(20px) saturate(160%)' } as ViewStyle) : {};

/** Barra flotante tipo glass con botón central para registrar cómo te sientes. */
export function BottomNav({ currentTab }: BottomNavProps) {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const renderTab = (tab: Tab) => {
    const isActive = currentTab === tab.id;
    const color = isActive ? (theme.isDark ? '#f3e7a0' : '#1a2b44') : theme.textMuted;
    return (
      <ScalePress
        key={tab.id}
        style={[styles.tab, isActive && styles.activePill]}
        onPress={() => router.push(tab.route)}
        accessibilityRole="button"
        accessibilityLabel={tab.a11y}
        accessibilityState={{ selected: isActive }}
      >
        <tab.Icon size={21} color={color} />
        <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
          {tab.label}
        </Text>
      </ScalePress>
    );
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 12) }]} pointerEvents="box-none">
      <View
        style={[
          styles.bar,
          webBlur,
          {
            backgroundColor: theme.isDark
              ? 'rgba(10, 18, 32, 0.78)'
              : Platform.OS === 'web'
                ? 'rgba(255, 255, 255, 0.58)'
                : 'rgba(255, 253, 247, 0.94)',
            borderColor: theme.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.92)',
          },
        ]}
      >
        {/* Línea especular superior (efecto cristal) */}
        <View
          style={[
            styles.topShine,
            { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.95)' },
          ]}
          pointerEvents="none"
        />

        {LEFT_TABS.map(renderTab)}
        {/* Espacio reservado para el botón central, que sobresale de la barra */}
        <View style={styles.centerSlot} />
        {RIGHT_TABS.map(renderTab)}
      </View>

      <View style={[styles.fabAnchor, { bottom: Math.max(insets.bottom, 12) + 30 }]} pointerEvents="box-none">
        <ScalePress
          style={[styles.fab, currentTab === 'checkin' && styles.fabActive]}
          onPress={() => router.push('/checkin')}
          accessibilityRole="button"
          accessibilityLabel="Registrar cómo te sientes"
        >
          <PlusIcon size={28} color="#f2c14e" />
        </ScalePress>
      </View>
    </View>
  );
}
