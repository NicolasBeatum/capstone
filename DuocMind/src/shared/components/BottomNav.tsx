import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from './BottomNav.styles';
import { type Href, useRouter } from 'expo-router';
import { useTheme } from '../theme';
import {
  HomeIcon,
  SmileIcon,
  SparkleIcon,
  UserIcon,
} from './icons';

interface BottomNavProps {
  currentTab: 'home' | 'checkin' | 'wellness' | 'profile';
}

export function BottomNav({ currentTab }: BottomNavProps) {
  const router = useRouter();
  const theme = useTheme();

  const tabs: Array<{
    id: BottomNavProps['currentTab'];
    label: string;
    route: Href;
    a11y: string;
    Icon: (props: { size?: number; color?: string }) => React.ReactNode;
  }> = [
    { id: 'home' as const, label: 'Inicio', route: '/views/dashboard', a11y: 'Ir al inicio', Icon: HomeIcon },
    { id: 'checkin' as const, label: 'Check-in', route: '/views/checkin', a11y: 'Ir a Check-in', Icon: SmileIcon },
    { id: 'wellness' as const, label: 'Bienestar', route: '/views/wellness', a11y: 'Ir al centro de bienestar', Icon: SparkleIcon },
    { id: 'profile' as const, label: 'Perfil', route: '/views/profile', a11y: 'Ir al perfil', Icon: UserIcon },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          /* Glassmorphism dinámico según tema */
          backgroundColor: theme.isDark
            ? 'rgba(10, 18, 32, 0.85)'
            : 'rgba(255, 255, 255, 0.80)',
          borderTopColor: theme.isDark
            ? 'rgba(255, 255, 255, 0.10)'
            : 'rgba(255, 255, 255, 0.75)',
        },
      ]}
    >
      {/* Línea especular superior (efecto cristal) */}
      <View
        style={[
          styles.topShine,
          { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.60)' },
        ]}
        pointerEvents="none"
      />

      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        const color = isActive
          ? (theme.isDark ? '#f3e7a0' : '#1a2b44')
          : theme.textMuted;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, isActive && styles.activePill]}
            onPress={() => {
              if (isActive) return;
              router.push(tab.route);
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={tab.a11y}
          >
            <tab.Icon size={21} color={color} />
            <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
