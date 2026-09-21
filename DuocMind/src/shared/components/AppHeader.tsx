import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a2b44',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f3e7a0',
  },
  avatarInitial: {
    color: '#f3e7a0',
    fontSize: 14,
    fontWeight: '700',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  appTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  appSubtitle: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  quoteIcon: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.30)',
  },
  dropdownCard: {
    position: 'absolute',
    top: 75,
    left: 20,
    width: 236,
    borderRadius: 22,
    padding: 12,
    borderWidth: 1.5,
    borderTopColor: 'rgba(255, 255, 255, 0.55)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.20,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
  },
  glassShine: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  dropdownAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a2b44',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  dropdownAvatarInitial: {
    color: '#f3e7a0',
    fontSize: 12,
    fontWeight: '700',
  },
  profileTexts: {
    flex: 1,
  },
  profileName: {
    fontSize: 12,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 10,
    marginTop: 1,
  },
  dropdownDivider: {
    height: 1,
    marginVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  menuItemIcon: {
    fontSize: 14,
    marginRight: 10,
  },
  menuItemLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  logoutItem: {
    marginTop: 2,
  },
  logoutLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
});
