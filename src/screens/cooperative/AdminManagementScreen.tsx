import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import { cooperativeApi } from '../../api/cooperativeApi';
import {
  CooperativeMember,
  MemberRole,
  PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  Permission,
} from '../../models';
import { usePermissions } from '../../hooks/usePermissions';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<HomeStackParamList, 'AdminManagement'>;

const AdminManagementScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId } = route.params;

  // Permission checks
  const {
    canAddAdmins,
    canRemoveAdmins,
    canEditAdminPermissions,
  } = usePermissions(cooperativeId);

  // State
  const [admins, setAdmins] = useState<CooperativeMember[]>([]);
  const [allMembers, setAllMembers] = useState<CooperativeMember[]>([]);
  const [predefinedRoles, setPredefinedRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);

  // Load admins
  const loadAdmins = useCallback(async () => {
    try {
      const response = await cooperativeApi.getAdmins(cooperativeId);
      if (response.success) {
        setAdmins(response.data);
      }
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to load admins'));
    }
  }, [cooperativeId]);

  // Load all members (for adding new admins)
  const loadAllMembers = useCallback(async () => {
    try {
      const response = await cooperativeApi.getMembers(cooperativeId);
      if (response.success) {
        // Filter out existing admins/moderators
        const regularMembers = response.data.filter(
          (m) => m.role === 'member' && m.status === 'active'
        );
        setAllMembers(regularMembers);
      }
    } catch (error: any) {
      console.error('Failed to load members:', error);
    }
  }, [cooperativeId]);

  // Load predefined roles
  const loadPredefinedRoles = useCallback(async () => {
    try {
      const response = await cooperativeApi.getPredefinedRoles();
      if (response.success) {
        setPredefinedRoles(response.data);
      }
    } catch (error: any) {
      console.error('Failed to load predefined roles:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([loadAdmins(), loadAllMembers(), loadPredefinedRoles()]);
    setIsLoading(false);
  }, [loadAdmins, loadAllMembers, loadPredefinedRoles]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Promote member to admin/moderator — navigate to full page
  const handlePromoteMember = (member: CooperativeMember) => {
    const firstName = member.user?.firstName || member.firstName || '';
    const lastName = member.user?.lastName || member.lastName || '';
    setShowAddAdminModal(false);
    navigation.navigate('AdminPromoteMember', {
      cooperativeId,
      memberId: member.id,
      memberName: `${firstName} ${lastName}`.trim(),
    });
  };

  // Edit permissions for existing moderator — navigate to full page
  const handleEditPermissions = (admin: CooperativeMember) => {
    const firstName = admin.user?.firstName || admin.firstName || '';
    const lastName = admin.user?.lastName || admin.lastName || '';
    navigation.navigate('AdminEditPermissions', {
      cooperativeId,
      memberId: admin.id,
      memberName: `${firstName} ${lastName}`.trim(),
      currentPermissions: admin.permissions || [],
    });
  };

  // Remove admin status
  const handleRemoveAdmin = (admin: CooperativeMember) => {
    const firstName = admin.user?.firstName || admin.firstName || 'Unknown';
    const lastName = admin.user?.lastName || admin.lastName || '';
    Alert.alert(
      'Remove Admin',
      `Are you sure you want to remove admin privileges from ${firstName} ${lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await cooperativeApi.removeAdmin(cooperativeId, admin.id);
              if (response.success) {
                Alert.alert('Success', 'Admin privileges removed');
                await loadData();
              }
            } catch (error: any) {
              Alert.alert('Error', getErrorMessage(error, 'Failed to remove admin'));
            }
          },
        },
      ]
    );
  };

  // Get role title label
  const getRoleTitleLabel = (roleTitle?: string): string => {
    const labels: Record<string, string> = {
      president: 'President',
      vice_president: 'Vice President',
      secretary: 'Secretary',
      financial_secretary: 'Financial Secretary',
      treasurer: 'Treasurer',
      pro: 'PRO',
      auditor: 'Auditor',
      welfare_officer: 'Welfare Officer',
    };
    return roleTitle ? labels[roleTitle] || roleTitle : '';
  };

  // Get role icon
  const getRoleIcon = (roleTitle?: string): string => {
    const icons: Record<string, string> = {
      president: '👑',
      vice_president: '🏛️',
      secretary: '📝',
      financial_secretary: '📊',
      treasurer: '💰',
      pro: '📢',
      auditor: '🔍',
      welfare_officer: '🤝',
    };
    return roleTitle ? icons[roleTitle] || '' : '';
  };

  // Render admin card
  const renderAdminCard = ({ item }: { item: CooperativeMember }) => {
    const isFullAdmin = item.role === 'admin';
    const firstName = item.user?.firstName || item.firstName || 'Unknown';
    const lastName = item.user?.lastName || item.lastName || '';
    const email = item.user?.email || item.email || '';
    const hasRoleTitle = !!item.roleTitle;
    const roleIcon = getRoleIcon(item.roleTitle);
    const roleTitleLabel = getRoleTitleLabel(item.roleTitle);

    return (
      <View style={styles.adminCard}>
        <View style={styles.adminHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {firstName[0]}{lastName[0] || ''}
            </Text>
          </View>
          <View style={styles.adminInfo}>
            <Text style={styles.adminName}>
              {firstName} {lastName}
            </Text>
            <Text style={styles.adminEmail}>{email}</Text>
          </View>
          <View style={[styles.roleBadge, isFullAdmin && styles.adminBadge]}>
            <Text style={[styles.roleText, isFullAdmin && styles.adminRoleText]}>
              {hasRoleTitle
                ? `${roleIcon} ${roleTitleLabel}`
                : isFullAdmin
                  ? '👑 Admin'
                  : '🛡️ Moderator'}
            </Text>
          </View>
        </View>

        {!isFullAdmin && item.permissions && item.permissions.length > 0 && (
          <View style={styles.permissionsPreview}>
            <Text style={styles.permissionsLabel}>Permissions:</Text>
            <Text style={styles.permissionsCount}>
              {item.permissions.length} of {Object.keys(PERMISSIONS).length}
            </Text>
          </View>
        )}

        {isFullAdmin ? (
          <Text style={styles.fullAccessText}>Full access to all features</Text>
        ) : (
          <View style={styles.actionButtons}>
            {canEditAdminPermissions && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditPermissions(item)}
              >
                <Icon name="Settings" size={16} color={colors.primary.main} />
                <Text style={styles.editButtonText}>Edit Permissions</Text>
              </TouchableOpacity>
            )}
            {canRemoveAdmins && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveAdmin(item)}
              >
                <Icon name="UserMinus" size={16} color={colors.error.main} />
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // Render member to add
  const renderMemberToAdd = ({ item }: { item: CooperativeMember }) => {
    const firstName = item.user?.firstName || item.firstName || 'Unknown';
    const lastName = item.user?.lastName || item.lastName || '';
    const email = item.user?.email || item.email || '';

    return (
      <TouchableOpacity
        style={styles.memberItem}
        onPress={() => handlePromoteMember(item)}
      >
        <View style={styles.memberAvatar}>
          <Text style={styles.memberAvatarText}>
            {firstName[0]}{lastName[0] || ''}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {firstName} {lastName}
          </Text>
          <Text style={styles.memberEmail}>{email}</Text>
        </View>
        <Icon name="Plus" size={20} color={colors.primary.main} />
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.main} />
        <Text style={styles.loadingText}>Loading admins...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={admins}
        renderItem={renderAdminCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Administrators</Text>
            <Text style={styles.headerSubtitle}>
              Manage who can administer this cooperative
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="Users" size={48} color={colors.text.disabled} />
            <Text style={styles.emptyText}>No admins found</Text>
          </View>
        }
      />

      {/* Add Admin Button - only show if user has permission */}
      {canAddAdmins && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowAddAdminModal(true)}
        >
          <Icon name="UserPlus" size={24} color={colors.primary.contrast} />
        </TouchableOpacity>
      )}

      {/* Add Admin Modal */}
      <Modal
        visible={showAddAdminModal}
        onClose={() => setShowAddAdminModal(false)}
        title="Add Administrator"
      >
        <View style={styles.modalContent}>
          {allMembers.length === 0 ? (
            <Text style={styles.noMembersText}>
              No regular members available to promote
            </Text>
          ) : (
            <FlatList
              data={allMembers}
              renderItem={renderMemberToAdd}
              keyExtractor={(item) => item.id}
              style={styles.membersList}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.text.secondary,
  },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  adminCard: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  adminHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary.main,
  },
  adminInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  adminEmail: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.info.light,
  },
  adminBadge: {
    backgroundColor: colors.warning.light,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.info.main,
  },
  adminRoleText: {
    color: colors.warning.main,
  },
  permissionsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  permissionsLabel: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  permissionsCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary.main,
    marginLeft: spacing.xs,
  },
  fullAccessText: {
    fontSize: 13,
    color: colors.success.main,
    fontStyle: 'italic',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing.md,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary.light,
    gap: spacing.xs,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary.main,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.error.light,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.error.main,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.text.secondary,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  modalContent: {
    maxHeight: 400,
  },
  membersList: {
    maxHeight: 350,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  memberInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  memberEmail: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  noMembersText: {
    textAlign: 'center',
    color: colors.text.secondary,
    padding: spacing.xl,
  },
});

export default AdminManagementScreen;
