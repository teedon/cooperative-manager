import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';
import { colors, spacing, borderRadius, shadows } from '../../theme';

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
    { icon: '👤', label: 'Edit Profile', onPress: () => {} },
    { icon: '🔔', label: 'Notifications', onPress: () => {} },
    { icon: '🔒', label: 'Privacy & Security', onPress: () => {} },
    { icon: '❓', label: 'Help & Support', onPress: () => {} },
    { icon: 'ℹ️', label: 'About', onPress: () => {} },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.profileSection}>
          <Image
            source={{ uri: user?.avatarUrl || 'https://i.pravatar.cc/150?u=default' }}
            style={styles.avatar}
          />
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
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
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
  menuIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  menuLabel: {
    fontSize: 16,
    color: colors.text.primary,
  },
  menuArrow: {
    fontSize: 16,
    color: colors.text.disabled,
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
  logoutIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
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
