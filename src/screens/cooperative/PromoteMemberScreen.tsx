import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../navigation/MainNavigator';
import {
  MemberRole,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  Permission,
  PredefinedRole,
  PredefinedRoleType,
} from '../../models';
import { cooperativeApi } from '../../api/cooperativeApi';
import { colors, spacing, borderRadius, shadows } from '../../theme';
import Icon from '../../components/common/Icon';
import Button from '../../components/common/Button';
import { getErrorMessage } from '../../utils/errorHandler';

type Props = NativeStackScreenProps<HomeStackParamList, 'AdminPromoteMember'>;

const ROLE_EMOJI: Record<string, string> = {
  president: '👑',
  vice_president: '🏛️',
  secretary: '📝',
  financial_secretary: '📊',
  treasurer: '💰',
  pro: '📢',
  auditor: '🔍',
  welfare_officer: '🤝',
};

const PromoteMemberScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cooperativeId, memberId, memberName } = route.params;

  const [predefinedRoles, setPredefinedRoles] = useState<PredefinedRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [selectedRole, setSelectedRole] = useState<MemberRole>('moderator');
  const [selectedPredefinedRole, setSelectedPredefinedRole] = useState<PredefinedRoleType | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [showPredefinedRoles, setShowPredefinedRoles] = useState(true);

  useEffect(() => {
    cooperativeApi
      .getPredefinedRoles()
      .then((res) => {
        if (res.success) setPredefinedRoles(res.data);
      })
      .catch((err) => console.error('Failed to load predefined roles:', err))
      .finally(() => setIsLoadingRoles(false));
  }, []);

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const toggleGroup = (groupPermissions: string[]) => {
    const allSelected = groupPermissions.every((p) => selectedPermissions.includes(p));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !groupPermissions.includes(p)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...groupPermissions])]);
    }
  };

  const handleSelectPredefinedRole = (role: PredefinedRole) => {
    setSelectedPredefinedRole(role.role);
    setSelectedPermissions(role.permissions);
    setSelectedRole(role.role === 'president' ? 'admin' : 'moderator');
  };

  const handleSave = async () => {
    if (selectedRole === 'moderator' && selectedPermissions.length === 0 && !selectedPredefinedRole) {
      Alert.alert('No Permissions', 'Please select at least one permission for the moderator.');
      return;
    }

    setIsSaving(true);
    try {
      const response = await cooperativeApi.updateMemberRoleWithPermissions(
        cooperativeId,
        memberId,
        selectedRole,
        selectedRole === 'moderator' ? selectedPermissions : undefined,
        selectedPredefinedRole || null
      );

      if (response.success) {
        Alert.alert('Success', 'Member role updated successfully');
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to update role'));
    } finally {
      setIsSaving(false);
    }
  };

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
              <View style={[
                styles.permissionCheckbox,
                selectedPermissions.includes(permission) && styles.permissionCheckboxChecked,
              ]}>
                {selectedPermissions.includes(permission) && (
                  <Icon name="Check" size={14} color={colors.primary.contrast} />
                )}
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

  const isSaveDisabled =
    isSaving ||
    (selectedRole === 'moderator' && selectedPermissions.length === 0 && !selectedPredefinedRole);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Member info banner */}
        <View style={styles.memberBanner}>
          <View style={styles.memberAvatar}>
            <Text style={styles.memberAvatarText}>
              {memberName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.memberName}>{memberName}</Text>
            <Text style={styles.memberSubtext}>Select a role to assign</Text>
          </View>
        </View>

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
          isLoadingRoles ? (
            <View style={styles.loadingRoles}>
              <ActivityIndicator color={colors.primary.main} />
            </View>
          ) : (
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
                      {ROLE_EMOJI[role.role] || ''} {role.label}
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
          )
        )}

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or select manually</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Full Admin option */}
        <TouchableOpacity
          style={[
            styles.roleOption,
            selectedRole === 'admin' && !selectedPredefinedRole && styles.roleOptionSelected,
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

        {/* Custom Moderator option */}
        <TouchableOpacity
          style={[
            styles.roleOption,
            selectedRole === 'moderator' && !selectedPredefinedRole && styles.roleOptionSelected,
          ]}
          onPress={() => {
            setSelectedRole('moderator');
            setSelectedPredefinedRole(null);
            setSelectedPermissions([]);
          }}
        >
          <Text style={styles.roleOptionTitle}>🛡️ Custom Moderator</Text>
          <Text style={styles.roleOptionDesc}>
            Custom permissions — select what they can access
          </Text>
        </TouchableOpacity>

        {/* Custom permissions picker */}
        {selectedRole === 'moderator' && !selectedPredefinedRole && (
          <View style={styles.customPermissionsSection}>
            <View style={styles.customPermissionsHeader}>
              <Text style={styles.sectionLabel}>Select Permissions</Text>
              <Text style={styles.selectedCountBadge}>
                {selectedPermissions.length} selected
              </Text>
            </View>
            {Object.keys(PERMISSION_GROUPS).map(renderPermissionGroup)}
          </View>
        )}

        {/* Selected predefined role permissions summary */}
        {selectedPredefinedRole && selectedRole === 'moderator' && (
          <View style={styles.permissionsSummary}>
            <Text style={styles.permissionsSummaryTitle}>
              Assigned Permissions ({selectedPermissions.length})
            </Text>
            <TouchableOpacity
              style={styles.customizeLink}
              onPress={() => setSelectedPredefinedRole(null)}
            >
              <Text style={styles.customizeLinkText}>Customize permissions</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Fixed footer buttons */}
      <View style={styles.footer}>
        <Button
          title="Cancel"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.footerButton}
        />
        <Button
          title={isSaving ? 'Saving...' : 'Save'}
          onPress={handleSave}
          disabled={isSaveDisabled}
          style={styles.footerButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.default,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  memberBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary.main,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  memberSubtext: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 2,
  },
  sectionToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  loadingRoles: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
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
    backgroundColor: colors.primary.light + '30',
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
  roleOption: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border.light,
    marginBottom: spacing.sm,
    backgroundColor: colors.background.paper,
  },
  roleOptionSelected: {
    borderColor: colors.primary.main,
    backgroundColor: colors.primary.light + '30',
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
  customPermissionsSection: {
    marginTop: spacing.sm,
  },
  customPermissionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  selectedCountBadge: {
    fontSize: 13,
    color: colors.primary.main,
    fontWeight: '600',
  },
  permissionGroup: {
    marginBottom: spacing.md,
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.sm,
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
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  permissionCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.border.main,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.default,
  },
  permissionCheckboxChecked: {
    backgroundColor: colors.primary.main,
    borderColor: colors.primary.main,
  },
  permissionLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  permissionsSummary: {
    backgroundColor: colors.success.light + '40',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.success.main,
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
  footer: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background.paper,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    ...shadows.sm,
  },
  footerButton: {
    flex: 1,
  },
});

export default PromoteMemberScreen;
