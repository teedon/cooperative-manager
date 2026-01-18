import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { organizationsApi, Staff } from '../../api/organizationsApi';
import Icon from '../../components/common/Icon';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<HomeStackParamList, 'StaffList'>;

const StaffListScreen: React.FC<Props> = ({ navigation, route }) => {
  const { organizationId } = route.params;

  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await organizationsApi.getAllStaff(organizationId);
      setStaff(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStaff();
  };

  const handleStaffPress = (staffMember: Staff) => {
    navigation.navigate('StaffDetail', {
      organizationId,
      staffId: staffMember.id,
    });
  };

  const handleCreatePress = () => {
    navigation.navigate('CreateStaff', { organizationId });
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? colors.success.main : colors.text.disabled;
  };

  const renderStaffMember = ({ item }: { item: Staff }) => (
    <TouchableOpacity
      style={styles.staffCard}
      onPress={() => handleStaffPress(item)}
    >
      <View style={styles.staffHeader}>
        <View style={styles.staffAvatar}>
          <Text style={styles.staffInitials}>
            {item.user?.firstName?.[0] || ''}{item.user?.lastName?.[0] || ''}
          </Text>
        </View>
        <View style={styles.staffInfo}>
          <Text style={styles.staffName}>
            {item.user?.firstName || ''} {item.user?.lastName || ''}
          </Text>
          <Text style={styles.staffEmail}>{item.user?.email || ''}</Text>
          <View style={styles.staffMeta}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(item.isActive) },
              ]}
            />
            <Text style={styles.staffStatus}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <Icon name="chevron-forward" size={20} color={colors.text.secondary} />
      </View>
      {item.permissions.length > 0 && (
        <View style={styles.permissionsContainer}>
          <Text style={styles.permissionsLabel}>Permissions:</Text>
          <View style={styles.permissionsList}>
            {item.permissions.slice(0, 3).map((permission, index) => (
              <View key={index} style={styles.permissionBadge}>
                <Text style={styles.permissionText}>
                  {permission.replace(/_/g, ' ')}
                </Text>
              </View>
            ))}
            {item.permissions.length > 3 && (
              <View style={styles.permissionBadge}>
                <Text style={styles.permissionText}>
                  +{item.permissions.length - 3} more
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Loading staff...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle" size={48} color={colors.error.main} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStaff}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={staff}
        renderItem={renderStaffMember}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={64} color={colors.text.disabled} />
            <Text style={styles.emptyText}>No staff members yet</Text>
            <Text style={styles.emptySubtext}>
              Add staff members to manage your cooperatives
            </Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={handleCreatePress}>
        <Icon name="person-add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.text.secondary,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.error.main,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary.main,
    borderRadius: borderRadius.sm,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.md,
  },
  staffCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  staffInitials: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  staffEmail: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 2,
  },
  staffMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  staffStatus: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  permissionsContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  permissionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  permissionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  permissionBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    backgroundColor: colors.primary.light,
    borderRadius: borderRadius.sm / 2,
  },
  permissionText: {
    fontSize: 11,
    color: colors.primary.dark,
    textTransform: 'capitalize',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing['5xl'],
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
});

export default StaffListScreen;
