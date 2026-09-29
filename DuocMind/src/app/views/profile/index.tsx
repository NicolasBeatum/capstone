import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BottomNav } from '@/shared/components/BottomNav';
import { GlassCard, LiquidBackground } from '@/shared/components/glass';
import {
  BellIcon,
  LogoutIcon,
  SlidersIcon,
} from '@/shared/components/icons';
import { styles } from '@/shared/styles/profile.styles';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  danger?: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();

  const menuItems: MenuItem[] = [
    {
      id: 'settings',
      label: 'Configuración',
      icon: <SlidersIcon size={20} color="#1a2b44" />,
      onPress: () =>
        Alert.alert('Configuración', 'Ajustes de perfil y preferencias de notificaciones.'),
    },
    {
      id: 'notifications',
      label: 'Notificaciones',
      icon: <BellIcon size={20} color="#1a2b44" />,
      onPress: () => Alert.alert('Notificaciones', 'Gestiona tus recordatorios de bienestar.'),
    },
    {
      id: 'logout',
      label: 'Cerrar sesión',
      icon: <LogoutIcon size={20} color="#e11d48" />,
      onPress: () => router.push('/views/auth/login'),
      danger: true,
    },
  ];

  return (
    <View style={styles.safeArea}>
      <LiquidBackground />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.greetingTitle}>Tu Perfil</Text>
            <Text style={styles.greetingSubtitle}>Cuida tu cuenta y preferencias</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>CM</Text>
          </View>
        </View>

        {/* ── Tarjeta de identidad ── */}
        <GlassCard style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>CM</Text>
          </View>
          <Text style={styles.profileName}>Camila Mora</Text>
          <Text style={styles.profileEmail}>c.mora@universidad.edu</Text>
        </GlassCard>

        {/* ── Menú de opciones ── */}
        <GlassCard style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuRow, index < menuItems.length - 1 && styles.menuRowBorder]}
              onPress={item.onPress}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <View style={styles.menuIconCircle}>{item.icon}</View>
              <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>
                {item.label}
              </Text>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </GlassCard>
      </ScrollView>

      <BottomNav currentTab="profile" />
    </View>
  );
}
