import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

interface BottomNavProps {
  currentTab: 'home' | 'checkin' | 'wellness';
}

export function BottomNav({ currentTab }: BottomNavProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, currentTab === 'home' && styles.activeTab]}
        onPress={() => router.push('/dashboard')}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Ir al Inicio"
      >
        <Text style={[styles.tabIcon, currentTab === 'home' && styles.activeTabIcon]}>⌂</Text>
        <Text style={[styles.tabLabel, currentTab === 'home' && styles.activeTabLabel]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, currentTab === 'checkin' && styles.activeTab]}
        onPress={() => router.push('/checkin')}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Ir a Check-in"
      >
        <Text style={[styles.tabIcon, currentTab === 'checkin' && styles.activeTabIcon]}>☺</Text>
        <Text style={[styles.tabLabel, currentTab === 'checkin' && styles.activeTabLabel]}>Check-in</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, currentTab === 'wellness' && styles.activeTab]}
        onPress={() => router.push('/wellness')}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Ir a Centro de Bienestar"
      >
        <Text style={[styles.tabIcon, currentTab === 'wellness' && styles.activeTabIcon]}>✦</Text>
        <Text style={[styles.tabLabel, currentTab === 'wellness' && styles.activeTabLabel]}>Wellness</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: '#f3e7a0',
  },
  tabIcon: {
    fontSize: 20,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  activeTabIcon: {
    color: '#1a2b44',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 2,
  },
  activeTabLabel: {
    color: '#1a2b44',
  },
});

