import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { glassTokens } from '@/shared/components/Glass';
import { BellIcon } from '@/shared/components/Icons';
import { ScalePress } from '@/shared/components/ScalePress';
import { SwipeToDismiss } from '@/shared/components/SwipeToDismiss';
import { fontFamily as font } from '@/shared/theme/typography';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
}

interface NotificationsModalProps {
  visible: boolean;
  notifications: AppNotification[];
  onClose: () => void;
  onDismiss: (id: string) => void;
}

/* backdropFilter solo existe en web; en Android el vidrio se simula con la superficie translúcida */
const webBlur = (amount: number): ViewStyle =>
  Platform.OS === 'web' ? ({ backdropFilter: `blur(${amount}px)` } as ViewStyle) : {};

/** Panel glass que se despliega desde la campana del dashboard. */
export function NotificationsModal({ visible, notifications, onClose, onDismiss }: NotificationsModalProps) {
  const panel = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    panel.setValue(0);
    Animated.spring(panel, { toValue: 1, speed: 16, bounciness: 6, useNativeDriver: true }).start();
  }, [visible, panel]);

  const panelStyle = {
    opacity: panel,
    transform: [
      { translateY: panel.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) },
      { scale: panel.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
    ],
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, webBlur(6)]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Cerrar notificaciones"
      />
      <View style={styles.anchor} pointerEvents="box-none">
        <Animated.View style={[styles.panel, webBlur(24), panelStyle]} accessibilityViewIsModal>
          <View style={styles.sheen} pointerEvents="none" />
          <Text style={styles.heading}>Notificaciones</Text>

          {notifications.length === 0 ? (
            <View style={styles.empty}>
              <BellIcon size={22} color="#94a3b8" />
              <Text style={styles.emptyText}>No tienes notificaciones por ahora.</Text>
            </View>
          ) : (
            <>
              {notifications.map((notification) => (
                <SwipeToDismiss key={notification.id} onDismiss={() => onDismiss(notification.id)}>
                  <ScalePress
                    style={styles.item}
                    onPress={notification.onPress}
                    accessibilityRole="button"
                    accessibilityLabel={notification.title}
                    accessibilityHint="Desliza a un lado para eliminarla"
                  >
                    <View style={styles.itemIcon}>{notification.icon}</View>
                    <View style={styles.itemText}>
                      <Text style={styles.itemTitle}>{notification.title}</Text>
                      <Text style={styles.itemDesc}>{notification.description}</Text>
                    </View>
                    <Text style={styles.itemArrow}>→</Text>
                  </ScalePress>
                </SwipeToDismiss>
              ))}
              <Text style={styles.hint}>Desliza una notificación a un lado para eliminarla</Text>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(26, 43, 68, 0.18)',
  },
  anchor: {
    flex: 1,
    alignItems: 'flex-end',
    paddingTop: 72,
    paddingHorizontal: 16,
  },
  panel: {
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'web' ? glassTokens.surfaceStrong : 'rgba(255, 252, 244, 0.96)',
    borderWidth: 1,
    borderColor: glassTokens.border,
    borderRadius: 22,
    padding: 14,
    gap: 10,
    ...glassTokens.shadow,
  },
  sheen: {
    position: 'absolute',
    top: 0,
    left: 18,
    right: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: glassTokens.sheen,
  },
  heading: {
    fontSize: 13,
    letterSpacing: 0.6,
    color: '#64748b',
    fontFamily: font.bold,
    paddingHorizontal: 4,
  },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: font.bold,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(251, 233, 196, 0.75)',
    borderWidth: 1,
    borderColor: glassTokens.border,
    borderRadius: 16,
    padding: 12,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    lineHeight: 19,
    color: '#1a2b44',
    fontFamily: font.bold,
  },
  itemDesc: {
    fontSize: 12,
    lineHeight: 17,
    color: '#475569',
    marginTop: 2,
  },
  hint: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
  itemArrow: {
    fontSize: 16,
    color: '#1a2b44',
    fontFamily: font.bold,
  },
});
