import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme';

interface BottomNavProps {
  currentTab: 'home' | 'checkin' | 'wellness';
}

export function BottomNav({ currentTab }: BottomNavProps) {
  const router = useRouter();
  const theme = useTheme();

  const tabs = [
    { id: 'home' as const, icon: '⌂', label: 'Home', route: '/dashboard', a11y: 'Ir al Inicio' },
    { id: 'checkin' as const, icon: '☺', label: 'Check-in', route: '/checkin', a11y: 'Ir a Check-in' },
    { id: 'wellness' as const, icon: '✦', label: 'Wellness', route: '/wellness', a11y: 'Ir a Centro de Bienestar' },
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
            onPress={() => router.push(tab.route as any)}
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  topShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});
