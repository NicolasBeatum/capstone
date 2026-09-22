import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { styles } from './AppHeader.styles';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme';

interface AppHeaderProps {
  title: string;
  subtitle: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const router = useRouter();
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleSettings = () => {
    setMenuVisible(false);
    Alert.alert('Configuración', 'Ajustes de perfil y preferencias de notificaciones.');
  };

  const handleLogout = () => {
    setMenuVisible(false);
    router.push('/login');
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={() => setMenuVisible(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Abrir menú de perfil"
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>CM</Text>
          </View>
          <View style={styles.onlineBadge} />
        </TouchableOpacity>

        <View>
          <Text style={[styles.appTitle, { color: theme.textPrimary }]}>{title}</Text>
          <Text style={[styles.appSubtitle, { color: theme.textMuted }]}>{subtitle}</Text>
        </View>
      </View>

      <Text style={[styles.quoteIcon, { color: theme.textMuted }]}>"</Text>

      {/* Menú desplegable flotante — Glassmorphism */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuVisible(false)}>
          <Pressable
            style={[
              styles.dropdownCard,
              {
                backgroundColor: theme.isDark
                  ? 'rgba(15, 26, 46, 0.82)'
                  : 'rgba(255, 255, 255, 0.72)',
                borderColor: theme.glassBorder,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Línea especular de vidrio */}
            <View style={styles.glassShine} />

            {/* Cabecera del perfil */}
            <View style={[styles.profileHeader, { borderBottomColor: theme.divider }]}>
              <View style={styles.dropdownAvatar}>
                <Text style={styles.dropdownAvatarInitial}>CM</Text>
              </View>
              <View style={styles.profileTexts}>
                <Text style={[styles.profileName, { color: theme.textPrimary }]}>
                  Camila Mora
                </Text>
                <Text style={[styles.profileEmail, { color: theme.textMuted }]}>
                  c.mora@universidad.edu
                </Text>
              </View>
            </View>

            <View style={[styles.dropdownDivider, { backgroundColor: theme.border }]} />

            {/* Configuración */}
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: 'transparent' }]}
              onPress={handleSettings}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemIcon}>⚙️</Text>
              <Text style={[styles.menuItemLabel, { color: theme.textSecondary }]}>
                Configuración
              </Text>
            </TouchableOpacity>

            {/* Cerrar sesión */}
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemIcon}>🚪</Text>
              <Text style={[styles.logoutLabel, { color: theme.danger }]}>
                Cerrar sesión
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
