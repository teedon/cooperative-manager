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
  Switch,
  ScrollView,
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
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CooperativeMember | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<MemberRole>('moderator');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load admins
  const loadAdmins = useCallback(async () => {
    try {
      const response = await cooperativeApi.getAdmins(cooperativeId);
      if (response.success) {
        setAdmins(response.data);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load admins');
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

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([loadAdmins(), loadAllMembers()]);
    setIsLoading(false);
  }, [loadAdmins, loadAllMembers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Toggle permission
  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  // Toggle all permissions in a group
  const toggleGroup = (groupPermissions: string[]) => {
    const allSelected = groupPermissions.every((p) => selectedPermissions.includes(p));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !groupPermissions.includes(p)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...groupPermissions])]);
    }
  };

  // Promote member to admin/moderator
  const handlePromoteMember = async (member: CooperativeMember) => {
    setSelectedMember(member);
    setSelectedRole('moderator');
    setSelectedPermissions([]);
    setShowAddAdminModal(false);
    setShowRoleModal(true);
  };

  // Save role change
  const handleSaveRole = async () => {
    if (!selectedMember) return;

    setIsUpdating(true);
    try {
      const response = await cooperativeApi.updateMemberRoleWithPermissions(
        cooperativeId,
        selectedMember.id,
        selectedRole,
        selectedRole === 'moderator' ? selectedPermissions : undefined
      );

      if (response.success) {
        Alert.alert('Success', 'Member role updated successfully');
        setShowRoleModal(false);
        setSelectedMember(null);
        await loadData();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update role');
    }
    setIsUpdating(false);
  };

  // Edit permissions for existing moderator
  const handleEditPermissions = (admin: CooperativeMember) => {
    setSelectedMember(admin);
    setSelectedPermissions(admin.permissions || []);
    setShowPermissionsModal(true);
  };

  // Save permissions
  const handleSavePermissions = async () => {
    if (!selectedMember) return;

    setIsUpdating(true);
    try {
      const response = await cooperativeApi.updateMemberPermissions(
        cooperativeId,
        selectedMember.id,
        selectedPermissions
      );

      if (response.success) {
        Alert.alert('Success', 'Permissions updated successfully');
        setShowPermissionsModal(false);
        setSelectedMember(null);
        await loadAdmins();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update permissions');
    }
    setIsUpdating(false);
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
              Alert.alert('Error', error.message || 'Failed to remove admin');
            }
          },
        },
      ]
    );
  };

  // Render admin card
  const renderAdminCard = ({ item }: { item: CooperativeMember }) => {
    const isFullAdmin = item.role === 'admin';
    const firstName = item.user?.firstName || item.firstName || 'Unknown';
    const lastName = item.user?.lastName || item.lastName || '';
    const email = item.user?.email || item.email || '';

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
              {isFullAdmin ? '👑 Admin' : '🛡️ Moderator'}
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

  // Render permission group
  const renderPermissionGroup = (groupKey: string) => {
    const group = PERMISSION_GROUPS[groupKey as keyof typeof PERMISSION_GROUPS];
    const groupPermissions = group.permissions;
    const selectedCount = groupPermissions.filter((p) => selectedPermissions.includes(p)).length;
    const allSelected = selectedCount === groupPermissions.length;

    return (
      <View key={groupKey} style={styles.permissionGroup}>
        <TouchableOpacity
          style={styles.groupHeader}
          onPress={() => toggleGroup(groupPermissions)}
        >
          <View style={styles.groupCheckbox}>
            {allSelected ? (
              <Icon name="CheckSquare" size={20} color={colors.primary.main} />
            ) : selectedCount > 0 ? (
              <Icon name="MinusSquare" size={20} color={colors.primary.main} />
            ) : (
              <Icon name="Square" size={20} color={colors.text.secondary} />
            )}
          </View>
          <Text style={styles.groupTitle}>{group.label}</Text>
          <Text style={styles.groupCount}>
            {selectedCount}/{groupPermissions.length}
          </Text>
        </TouchableOpacity>

        <View style={styles.permissionList}>
          {groupPermissions.map((permission) => (
            <TouchableOpacity
              key={permission}
              style={styles.permissionItem}
              onPress={() => togglePermission(permission)}
            >
              <View style={styles.permissionCheckbox}>
                {selectedPermissions.includes(permission) ? (
                  <Icon name="Check" size={16} color={colors.primary.main} />
                ) : null}
              </View>
              <Text style={styles.permissionLabel}>
                {PERMISSION_LABELS[permission as Permission]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
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

      {/* Role Selection Modal */}
      <Modal
        visible={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        title={`Promote ${selectedMember?.user.firstName || ''}`}
      >
        <View style={styles.modalContent}>
          <Text style={styles.sectionLabel}>Select Role</Text>

          <TouchableOpacity
            style={[styles.roleOption, selectedRole === 'admin' && styles.roleOptionSelected]}
            onPress={() => setSelectedRole('admin')}
          >
            <Text style={styles.roleOptionTitle}>👑 Full Admin</Text>
            <Text style={styles.roleOptionDesc}>
              Full access to all cooperative features and settings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleOption, selectedRole === 'moderator' && styles.roleOptionSelected]}
            onPress={() => setSelectedRole('moderator')}
          >
            <Text style={styles.roleOptionTitle}>🛡️ Moderator</Text>
            <Text style={styles.roleOptionDesc}>
              Custom permissions - select what they can access
            </Text>
          </TouchableOpacity>

          {selectedRole === 'moderator' && (
            <ScrollView style={styles.permissionsScroll}>
              <Text style={styles.sectionLabel}>Select Permissions</Text>
              {Object.keys(PERMISSION_GROUPS).map(renderPermissionGroup)}
            </ScrollView>
          )}

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setShowRoleModal(false)}
              style={styles.modalButton}
            />
            <Button
              title={isUpdating ? 'Saving...' : 'Save'}
              onPress={handleSaveRole}
              disabled={isUpdating || (selectedRole === 'moderator' && selectedPermissions.length === 0)}
              style={styles.modalButton}
            />
          </View>
        </View>
      </Modal>

      {/* Edit Permissions Modal */}
      <Modal
        visible={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
        title={`Edit Permissions - ${selectedMember?.user.firstName || ''}`}
      >
        <View style={styles.modalContent}>
          <ScrollView style={styles.permissionsScroll}>
            {Object.keys(PERMISSION_GROUPS).map(renderPermissionGroup)}
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              variant="outline"
              onPress={() => setShowPermissionsModal(false)}
              style={styles.modalButton}
            />
            <Button
              title={isUpdating ? 'Saving...' : 'Save'}
              onPress={handleSavePermissions}
              disabled={isUpdating || selectedPermissions.length === 0}
              style={styles.modalButton}
            />
          </View>
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
    maxHeight: 500,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  membersList: {
    maxHeight: 300,
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
  roleOption: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border.light,
    marginBottom: spacing.sm,
  },
  roleOptionSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light,
  },
  roleOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  roleOptionDesc: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  permissionsScroll: {
    maxHeight: 300,
  },
  permissionGroup: {
    marginBottom: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.secondary.main,
  },
  groupCheckbox: {
    marginRight: spacing.sm,
  },
  groupTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  groupCount: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  permissionList: {
    padding: spacing.sm,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  permissionCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border.main,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionLabel: {
    fontSize: 13,
    color: colors.text.primary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  modalButton: {
    minWidth: 100,
  },
});

export default AdminManagementScreen;
