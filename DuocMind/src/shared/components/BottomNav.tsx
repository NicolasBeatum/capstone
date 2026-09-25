import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from './BottomNav.styles';
import { type Href, useRouter } from 'expo-router';
import { useTheme } from '../theme';

interface BottomNavProps {
  currentTab: 'home' | 'checkin' | 'wellness';
}

export function BottomNav({ currentTab }: BottomNavProps) {
  const router = useRouter();
  const theme = useTheme();

  const tabs: Array<{
    id: BottomNavProps['currentTab'];
    icon: string;
    label: string;
    route: Href;
    a11y: string;
  }> = [
    { id: 'home' as const, icon: '⌂', label: 'Inicio', route: '/views/dashboard', a11y: 'Ir al inicio' },
    { id: 'checkin' as const, icon: '☺', label: 'Check-in', route: '/views/checkin', a11y: 'Ir a Check-in' },
    { id: 'wellness' as const, icon: '✦', label: 'Bienestar', route: '/views/wellness', a11y: 'Ir al centro de bienestar' },
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
        return (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              isActive && {
                backgroundColor: theme.isDark
                  ? 'rgba(243, 231, 160, 0.18)'
                  : 'rgba(243, 231, 160, 0.80)',
                borderWidth: 1,
                borderColor: theme.isDark
                  ? 'rgba(243, 231, 160, 0.30)'
                  : 'rgba(212, 180, 60, 0.50)',
              },
            ]}
            onPress={() => router.push(tab.route)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={tab.a11y}
          >
            <Text
              style={[
                styles.tabIcon,
                { color: isActive ? (theme.isDark ? '#f3e7a0' : '#1a2b44') : theme.textMuted },
              ]}
            >
              {tab.icon}
            </Text>
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? (theme.isDark ? '#f3e7a0' : '#1a2b44') : theme.textMuted },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
