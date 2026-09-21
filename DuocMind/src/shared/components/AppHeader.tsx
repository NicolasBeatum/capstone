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

interface AppHeaderProps {
  title: string;
  subtitle: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleSettings = () => {
    setMenuVisible(false);
    Alert.alert(
      'Configuración',
      'Ajustes de perfil y preferencias de notificaciones.'
    );
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
          <Text style={styles.appTitle}>{title}</Text>
          <Text style={styles.appSubtitle}>{subtitle}</Text>
        </View>
      </View>

      <Text style={styles.quoteIcon}>”</Text>

      {/* Menú desplegable flotante de usuario */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setMenuVisible(false)}
        >
          <Pressable style={styles.dropdownCard} onPress={(e) => e.stopPropagation()}>
            {/* Cabecera del perfil */}
            <View style={styles.profileHeader}>
              <View style={styles.dropdownAvatar}>
                <Text style={styles.dropdownAvatarInitial}>CM</Text>
              </View>
              <View style={styles.profileTexts}>
                <Text style={styles.profileName}>Camila Mora</Text>
                <Text style={styles.profileEmail}>c.mora@universidad.edu</Text>
              </View>
            </View>

            <View style={styles.dropdownDivider} />

            {/* Opciones del menú */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleSettings}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemIcon}>⚙️</Text>
              <Text style={styles.menuItemLabel}>Configuración</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <Text style={styles.menuItemIcon}>🚪</Text>
              <Text style={styles.logoutLabel}>Cerrar sesión</Text>
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
    color: '#1a2b44',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  quoteIcon: {
    fontSize: 28,
    color: '#cbd5e1',
    fontWeight: 'bold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  dropdownCard: {
    position: 'absolute',
    top: 75,
    left: 20,
    width: 230,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
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
    color: '#1a2b44',
  },
  profileEmail: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  menuItemIcon: {
    fontSize: 14,
    marginRight: 10,
  },
  menuItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  logoutItem: {
    marginTop: 2,
  },
  logoutLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e11d48',
  },
});

