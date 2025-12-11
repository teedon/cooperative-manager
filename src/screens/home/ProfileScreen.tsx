import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';

const ProfileScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  const menuItems = [
    { icon: 'User', label: 'Edit Profile', onPress: () => {} },
    { icon: 'Bell', label: 'Notifications', onPress: () => {} },
    { icon: 'Lock', label: 'Privacy & Security', onPress: () => {} },
    { icon: 'HelpCircle', label: 'Help & Support', onPress: () => {} },
    { icon: 'Info', label: 'About', onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.profileSection}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Icon name="User" size={40} color={colors.primary.contrast} />
            </View>
          )}
          <Text style={styles.name}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Cooperatives</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>$25,000</Text>
            <Text style={styles.statLabel}>Total Savings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Months Active</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIconContainer}>
                  <Icon name={item.icon} size={20} color={colors.primary.main} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Icon name="ChevronRight" size={20} color={colors.text.disabled} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="LogOut" size={20} color={colors.error.text} style={{ marginRight: spacing.sm }} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.primary.main,
    paddingTop: spacing['2xl'],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary.contrast,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    backgroundColor: colors.background.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: spacing.lg,
    backgroundColor: colors.secondary.dark,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: colors.background.paper,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.light,
  },
  menuSection: {
    backgroundColor: colors.background.paper,
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary.main,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIconContainer: {
    marginRight: spacing.md,
  },
  menuLabel: {
    fontSize: 16,
    color: colors.text.primary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error.light,
    marginTop: spacing['2xl'],
    marginHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error.text,
  },
  version: {
    textAlign: 'center',
    color: colors.text.disabled,
    fontSize: 12,
    marginTop: spacing['2xl'],
    marginBottom: spacing['3xl'],
  },
});

export default ProfileScreen;
