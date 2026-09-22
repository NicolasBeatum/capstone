import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
