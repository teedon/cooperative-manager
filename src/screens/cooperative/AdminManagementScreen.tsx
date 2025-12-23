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
  PredefinedRole,
  PredefinedRoleType,
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
  const [predefinedRoles, setPredefinedRoles] = useState<PredefinedRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CooperativeMember | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<MemberRole>('moderator');
  const [selectedPredefinedRole, setSelectedPredefinedRole] = useState<PredefinedRoleType | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPredefinedRoles, setShowPredefinedRoles] = useState(true);

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
    setSelectedPredefinedRole(null);
    setSelectedPermissions([]);
    setShowPredefinedRoles(true);
    setShowAddAdminModal(false);
    setShowRoleModal(true);
  };

  // Handle predefined role selection
  const handleSelectPredefinedRole = (role: PredefinedRole) => {
    setSelectedPredefinedRole(role.role);
    setSelectedPermissions(role.permissions);
    // If president, set as admin; otherwise moderator
    if (role.role === 'president') {
      setSelectedRole('admin');
    } else {
      setSelectedRole('moderator');
    }
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
        selectedRole === 'moderator' ? selectedPermissions : undefined,
        selectedPredefinedRole || null
      );

      if (response.success) {
        Alert.alert('Success', 'Member role updated successfully');
        setShowRoleModal(false);
        setSelectedMember(null);
        setSelectedPredefinedRole(null);
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
        title={`Promote ${selectedMember?.user?.firstName || selectedMember?.firstName || ''}`}
      >
        <ScrollView style={styles.modalContent}>
          {/* Predefined Roles Section */}
          <TouchableOpacity 
            style={styles.sectionToggle}
            onPress={() => setShowPredefinedRoles(!showPredefinedRoles)}
          >
            <Text style={styles.sectionLabel}>Cooperative Roles</Text>
            <Icon 
              name={showPredefinedRoles ? 'ChevronUp' : 'ChevronDown'} 
              size={20} 
              color={colors.text.secondary} 
            />
          </TouchableOpacity>

          {showPredefinedRoles && (
            <View style={styles.predefinedRolesContainer}>
              {predefinedRoles.map((role) => (
                <TouchableOpacity
                  key={role.role}
                  style={[
                    styles.predefinedRoleOption,
                    selectedPredefinedRole === role.role && styles.predefinedRoleSelected,
                  ]}
                  onPress={() => handleSelectPredefinedRole(role)}
                >
                  <View style={styles.predefinedRoleHeader}>
                    <Text style={[
                      styles.predefinedRoleTitle,
                      selectedPredefinedRole === role.role && styles.predefinedRoleTitleSelected,
                    ]}>
                      {role.role === 'president' && '👑 '}
                      {role.role === 'treasurer' && '💰 '}
                      {role.role === 'financial_secretary' && '📊 '}
                      {role.role === 'secretary' && '📝 '}
                      {role.role === 'vice_president' && '🏛️ '}
                      {role.role === 'pro' && '📢 '}
                      {role.role === 'auditor' && '🔍 '}
                      {role.role === 'welfare_officer' && '🤝 '}
                      {role.label}
                    </Text>
                    {selectedPredefinedRole === role.role && (
                      <Icon name="Check" size={18} color={colors.primary.main} />
                    )}
                  </View>
                  <Text style={styles.predefinedRoleDesc}>{role.description}</Text>
                  <Text style={styles.predefinedRolePermCount}>
                    {role.permissions.length} permissions
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Manual Role Selection */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or select manually</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={[
              styles.roleOption, 
              selectedRole === 'admin' && !selectedPredefinedRole && styles.roleOptionSelected
            ]}
            onPress={() => {
              setSelectedRole('admin');
              setSelectedPredefinedRole(null);
              setSelectedPermissions([]);
            }}
          >
            <Text style={styles.roleOptionTitle}>👑 Full Admin</Text>
            <Text style={styles.roleOptionDesc}>
              Full access to all cooperative features and settings
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleOption, 
              selectedRole === 'moderator' && !selectedPredefinedRole && styles.roleOptionSelected
            ]}
            onPress={() => {
              setSelectedRole('moderator');
              setSelectedPredefinedRole(null);
              setSelectedPermissions([]);
            }}
          >
            <Text style={styles.roleOptionTitle}>🛡️ Custom Moderator</Text>
            <Text style={styles.roleOptionDesc}>
              Custom permissions - select what they can access
            </Text>
          </TouchableOpacity>

          {selectedRole === 'moderator' && !selectedPredefinedRole && (
            <View style={styles.customPermissionsSection}>
              <Text style={styles.sectionLabel}>Select Permissions</Text>
              {Object.keys(PERMISSION_GROUPS).map(renderPermissionGroup)}
            </View>
          )}

          {/* Show selected permissions summary when predefined role is chosen */}
          {selectedPredefinedRole && selectedRole === 'moderator' && (
            <View style={styles.permissionsSummary}>
              <Text style={styles.permissionsSummaryTitle}>
                Assigned Permissions ({selectedPermissions.length})
              </Text>
              <TouchableOpacity
                style={styles.customizeLink}
                onPress={() => {
                  setSelectedPredefinedRole(null);
                  // Keep the permissions for customization
                }}
              >
                <Text style={styles.customizeLinkText}>Customize permissions</Text>
              </TouchableOpacity>
            </View>
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
              disabled={isUpdating || (selectedRole === 'moderator' && selectedPermissions.length === 0 && !selectedPredefinedRole)}
              style={styles.modalButton}
            />
          </View>
        </ScrollView>
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
    maxHeight: 550,
  },
  sectionToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  predefinedRolesContainer: {
    marginBottom: spacing.md,
  },
  predefinedRoleOption: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.paper,
  },
  predefinedRoleSelected: {
    borderColor: colors.primary.main,
    borderWidth: 2,
    backgroundColor: colors.primary.light,
  },
  predefinedRoleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  predefinedRoleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  predefinedRoleTitleSelected: {
    color: colors.primary.main,
  },
  predefinedRoleDesc: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  predefinedRolePermCount: {
    fontSize: 11,
    color: colors.text.disabled,
    marginTop: spacing.xs,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    paddingHorizontal: spacing.sm,
    fontSize: 12,
    color: colors.text.disabled,
  },
  customPermissionsSection: {
    marginTop: spacing.sm,
  },
  permissionsSummary: {
    backgroundColor: colors.success.light,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  permissionsSummaryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success.main,
  },
  customizeLink: {
    marginTop: spacing.xs,
  },
  customizeLinkText: {
    fontSize: 12,
    color: colors.primary.main,
    textDecorationLine: 'underline',
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
